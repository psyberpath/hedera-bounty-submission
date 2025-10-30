import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplianceLog } from './log.entity';
import * as crypto from 'crypto';
import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from '@hashgraph/sdk';
import { CreateLogDto } from './create-log.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

interface MirrorNodeTxResponse {
  transactions: {
    consensus_timestamp: string;
  }[];
}

interface MirrorNodeMsgResponse {
  messages: {
    message: string;
  }[];
}

@Injectable()
export class LogsService {
  private hederaClient: Client;
  private topicId: string = process.env.TOPIC_ID!;

  constructor(
    @InjectRepository(ComplianceLog)
    private logsRepository: Repository<ComplianceLog>,
    private readonly httpService: HttpService,
  ) {
    const accountId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
    const privateKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY!);
    this.hederaClient = Client.forTestnet().setOperator(accountId, privateKey);
  }

  async createLog(createLogDto: CreateLogDto): Promise<ComplianceLog> {
    const creationTime = new Date();
    const newLog = this.logsRepository.create({
      userId: createLogDto.userId,
      eventType: createLogDto.eventType,
      data: createLogDto.data,
      createdAt: creationTime,
    });

    const dataString =
      JSON.stringify(newLog.data) + newLog.createdAt.toISOString();
    const dataHash = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');

    const dataHashBytes = Buffer.from(dataHash, 'hex');

    const transaction = await new TopicMessageSubmitTransaction({
      topicId: this.topicId,
      message: dataHashBytes,
    }).execute(this.hederaClient);

    // const receipt = await transaction.getReceipt(this.hederaClient);
    const transactionId = transaction.transactionId.toString();

    newLog.hederaTransactionId = transactionId;
    return this.logsRepository.save(newLog);
  }

  async verifyLog(id: string): Promise<any> {
    const log = await this.logsRepository.findOneBy({ id });
    if (!log) {
      throw new NotFoundException('Log not found in database');
    }

    const dataString = JSON.stringify(log.data) + log.createdAt.toISOString();
    const calculatedHash = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');

    const parts = log.hederaTransactionId.split('@');
    const timeParts = parts[1].split('.');
    const formattedTxId = `${parts[0]}-${timeParts[0]}-${timeParts[1]}`;
    const mirrorNodeTxUrl = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${formattedTxId}`;

    let txResponse: AxiosResponse<MirrorNodeTxResponse>;
    try {
      // txResponse = await firstValueFrom(this.httpService.get(mirrorNodeTxUrl));
      txResponse = await firstValueFrom(
        this.httpService.get<MirrorNodeTxResponse>(mirrorNodeTxUrl),
      );
    } catch (error) {
      console.error('Hedera Mirror Node lookup failed: ', error);
      throw new NotFoundException(
        'Transaction not found on Hedera Mirror Node.',
      );
    }

    const consensus_timestamp =
      txResponse.data?.transactions?.[0]?.consensus_timestamp;
    if (!consensus_timestamp) {
      throw new Error(
        'Could not find consensus timestamp in transaction response.',
      );
    }

    const mirrorNodeTopicUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${this.topicId}/messages?timestamp=${consensus_timestamp}`;

    let msgResponse: AxiosResponse<MirrorNodeMsgResponse>;
    try {
      // msgResponse = await firstValueFrom(
      //   this.httpService.get(mirrorNodeTopicUrl),
      // );
      msgResponse = await firstValueFrom(
        this.httpService.get<MirrorNodeMsgResponse>(mirrorNodeTopicUrl),
      );
    } catch (error) {
      console.error('Error fetching from topic endpoint: ', error);
      throw new Error('Could not fetch message from topic endpoint.');
    }

    const hederaMessageBase64 = msgResponse.data?.messages?.[0]?.message;
    if (!hederaMessageBase64) {
      throw new Error('Could not find message payload on topic endpoint.');
    }

    const hederaHash = Buffer.from(hederaMessageBase64, 'base64').toString(
      'hex',
    );

    const isVerified = calculatedHash === hederaHash;

    return {
      isVerified,
      logId: log.id,
      databaseHash: calculatedHash,
      hederaHash: hederaHash,
      logDetails: log,
    };
  }
}

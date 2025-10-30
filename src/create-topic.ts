import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
} from '@hashgraph/sdk';
import 'dotenv/config';

async function main() {
  const myAccountId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
  const myPrivateKey = PrivateKey.fromStringED25519(
    process.env.MY_PRIVATE_KEY!,
  );

  const client = Client.forTestnet().setOperator(myAccountId, myPrivateKey);

  const txResponse = await new TopicCreateTransaction()
    .setAdminKey(myPrivateKey.publicKey)
    .setSubmitKey(myPrivateKey.publicKey)
    .execute(client);

  const receipt = await txResponse.getReceipt(client);
  const newTopicId = receipt.topicId;

  console.log('Your new TOPIC_ID is: ' + newTopicId?.toString());

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

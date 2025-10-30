import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ComplianceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  eventType: string;

  @Column('simple-json')
  data: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  hederaTransactionId: string;
}

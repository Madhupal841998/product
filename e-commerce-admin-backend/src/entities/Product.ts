import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity()
export class Products {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text', { array: true })
  images?: string[];

  @Column({ default: true })
  isactive!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdat!: Date;

  @UpdateDateColumn()
  updatedat!: Date;
}
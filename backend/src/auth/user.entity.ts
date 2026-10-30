import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
@Index('users_phone_unique', ['phone'], { unique: true, where: '"phone" IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 160, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true, unique: true })
  googleId?: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'first_name', type: 'varchar', length: 80, nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 80, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: 'user' | 'admin';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

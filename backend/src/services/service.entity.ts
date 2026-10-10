import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'studio_services' })
@Unique(['name'])
export class StudioService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  duration: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'image_data', type: 'text', nullable: true })
  imageData?: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 50, nullable: true })
  mimeType?: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

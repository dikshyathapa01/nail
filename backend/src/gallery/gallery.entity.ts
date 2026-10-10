import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'gallery_items' })
export class GalleryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 60 })
  category: string;

  @Column({ name: 'image_data', type: 'text', nullable: true })
  imageData?: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 50, nullable: true })
  mimeType?: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'cloudinary_public_id', type: 'varchar', length: 255, nullable: true })
  cloudinaryPublicId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

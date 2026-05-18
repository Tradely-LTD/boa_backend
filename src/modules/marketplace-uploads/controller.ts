import { Request, Response } from 'express';
import { getPresignedUploadUrl } from '../../services/s3Service';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// POST /api/marketplace/uploads/presigned-url  (manager auth)
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileExtension } = req.body;

    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase()))
      return res.status(400).json({ success: false, message: `Extension must be one of: ${ALLOWED_EXTENSIONS.join(', ')}` });

    const result = await getPresignedUploadUrl(fileExtension.toLowerCase());
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message ?? 'Failed to generate upload URL.' });
  }
};

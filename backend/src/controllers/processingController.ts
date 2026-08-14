import { Request, Response, NextFunction } from 'express';
import { processProduct } from '../services/processing/processingOrchestrator';
import { ExtractedField } from '../models/ExtractedField';
import { Evidence } from '../models/Evidence';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export async function startProcessing(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await processProduct(req.params.id as string);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getExtractedFields(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fields = await ExtractedField.find({ productId: req.params.id as string })
      .sort({ canonicalName: 1 })
      .lean();
    sendSuccess(res, fields);
  } catch (err) {
    next(err);
  }
}

export async function getEvidence(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const evidence = await Evidence.find({ productId: req.params.id as string })
      .sort({ canonicalName: 1 })
      .lean();
    sendSuccess(res, evidence);
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import { exportAsJson, exportAsCsv } from '../services/export/exportService';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';

export async function exportProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const format = (req.query.format as string || 'json').toLowerCase();

    if (format === 'json') {
      const data = await exportAsJson(req.params.id as string);
      sendSuccess(res, data);
    } else if (format === 'csv') {
      const csv = await exportAsCsv(req.params.id as string);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="spectrace-${req.params.id}.csv"`,
      );
      res.status(200).send(csv);
    } else {
      throw AppError.badRequest(`Unsupported format: ${format}. Use 'json' or 'csv'.`);
    }
  } catch (err) {
    next(err);
  }
}

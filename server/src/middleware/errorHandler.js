export class AppError extends Error {
  constructor(code, status, message, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

export function errorHandler(logger) {
  return (err, req, res, next) => {
    // Tangani error sintaks JSON dari express.json()
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      if (logger) logger.warn('Format JSON body request rusak', { ip: req.ip });
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Format JSON body permintaan tidak valid'
        }
      });
    }

    if (err instanceof AppError) {
      if (logger && err.status >= 500) {
        logger.error(err.message, { code: err.code, status: err.status });
      }
      return res.status(err.status).json({
        error: {
          code: err.code,
          message: err.message,
          ...err.extra
        }
      });
    }

    // Error tidak tertangani
    if (logger) {
      logger.error('Unhandled server error: ' + (err?.message || String(err)));
    } else {
      console.error(err);
    }

    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan internal pada server'
      }
    });
  };
}

const MAX_WIDTH = 256;
const MAX_HEIGHT = 256;
const JPEG_QUALITY = 0.85; // Calidad ligeramente superior para avatares

/**
 * Redimensiona una imagen codificada en base64 a un tamaño máximo manteniendo la relación de aspecto.
 * @param base64Str La cadena de la imagen en base64 (ej. de un FileReader o Canvas).
 * @returns Una Promise que se resuelve con la nueva cadena de imagen en base64 (formato JPEG).
 */
export const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Calcular nuevas dimensiones manteniendo la relación de aspecto
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('No se pudo obtener el contexto del canvas 2D.'));
            }

            // Dibujar la imagen redimensionada en el canvas
            ctx.drawImage(img, 0, 0, width, height);
            
            // Obtener la imagen como JPEG para un mejor control de la compresión
            resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };

        img.onerror = (error) => {
            reject(new Error(`No se pudo cargar la imagen para redimensionarla. ${error}`));
        };
    });
};

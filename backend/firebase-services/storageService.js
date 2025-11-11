const { bucket } = require('../firebaseConfig');
const path = require('path');

class StorageService {
  /**
   * Upload a file to Firebase Storage
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} fileName - The name of the file
   * @param {string} folder - The folder to upload to (e.g., 'products', 'services', 'general')
   * @returns {Promise<string>} - The public URL of the uploaded file
   */
  async uploadFile(fileBuffer, fileName, folder = 'general') {
    try {
      const timestamp = Date.now();
      const fileExtension = path.extname(fileName);
      const baseFileName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseFileName}_${timestamp}${fileExtension}`;
      const filePath = `${folder}/${uniqueFileName}`;

      const file = bucket.file(filePath);

      await file.save(fileBuffer, {
        metadata: {
          contentType: this.getContentType(fileName),
        },
        public: true,
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Return the public URL
      return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    } catch (error) {
      console.error('Error uploading file to Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param {string} fileUrl - The public URL of the file
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileUrl) {
    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split(`${bucket.name}/`);
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }

      const filePath = urlParts[1];
      const file = bucket.file(filePath);

      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file from Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} fileName
   * @returns {string}
   */
  getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array of {buffer, fileName, folder}
   * @returns {Promise<Array<string>>} - Array of public URLs
   */
  async uploadMultipleFiles(files) {
    try {
      const uploadPromises = files.map(({ buffer, fileName, folder }) =>
        this.uploadFile(buffer, fileName, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();

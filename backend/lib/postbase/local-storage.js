import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper class representing a file in storage
class LocalFile {
    constructor(bucketPath, publicBaseUrl, filePath) {
        this.bucketPath = bucketPath;
        this.publicBaseUrl = publicBaseUrl;
        this.filePath = filePath;
        this.fullPath = path.join(bucketPath, filePath);
    }

    async save(buffer, options = {}) {
        // Ensure directory exists
        await fs.promises.mkdir(path.dirname(this.fullPath), { recursive: true });

        // Write the file
        await fs.promises.writeFile(this.fullPath, buffer);

        if (options.contentType) {
            // Optionally, save metadata if needed in future (ignored here)
        }
    }

    async makePublic() {
        // On a local file system served by Nginx, files are public by default.
        // This function exists for API compatibility only.
        return true;
    }

    publicUrl() {
        // Create a URL like: https://www.app.com/uploads/path/to/file.png
        const relativePath = path.relative(this.bucketPath, this.fullPath);
        return `${this.publicBaseUrl.replace(/\/+$/, '')}/${relativePath}`;
    }
}

// Main Storage Bucket class
class LocalBucket {
    constructor(bucketPath, publicBaseUrl) {
        this.bucketPath = bucketPath;
        this.publicBaseUrl = publicBaseUrl;
    }

    file(filePath) {
        return new LocalFile(this.bucketPath, this.publicBaseUrl, filePath);
    }
}

// Storage interface (mimics `admin.storage().bucket()`)
export function createLocalStorage(bucketPath, publicBaseUrl) {
    return {
        bucket: () => new LocalBucket(bucketPath, publicBaseUrl)
    };
}

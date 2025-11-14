// client-storage-sdk.js
// Minimal Firebase-like client storage SDK for uploading files to an Express backend.
//
// Usage:
// const storage = createClientStorage('https://api.example.com', () => authToken);
// const ref = storage.ref('users/123/profile.jpg');
// const task = ref.put(file, { contentType: 'image/jpeg' });
// task.on(firebase.storage.TaskEvent.STATE_CHANGED, snapshot => { ... }, error => { ... }, () => { ... });

export const TaskEvent = {
    STATE_CHANGED: 'state_changed'
};

export const TaskState = {
    RUNNING: 'running',
    PAUSED: 'paused',
    SUCCESS: 'success',
    ERROR: 'error'
};

class UploadSnapshot {
    constructor(bytesTransferred, totalBytes, state, ref, serverResponse = null) {
        this.bytesTransferred = bytesTransferred;
        this.totalBytes = totalBytes;
        this.state = state;
        this.ref = ref;
        this.serverResponse = serverResponse;
    }
}

class UploadTask {
    constructor(ref, file, metadata, baseUrl, getAuthToken) {
        this.ref = ref;
        this.file = file;
        this.metadata = metadata || {};
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.getAuthToken = getAuthToken;
        this._xhr = null;
        this._listeners = []; // to support .on with (snapshotCallback, errorCb, completeCb)
        this._state = TaskState.PAUSED;
        this._bytesTransferred = 0;
        this._totalBytes = file.size;
        this._serverResponse = null;
        this._error = null;
        this._aborted = false;
        // start immediately
        this._start();
    }

    _emitSnapshot() {
        const snap = new UploadSnapshot(this._bytesTransferred, this._totalBytes, this._state, this.ref, this._serverResponse);
        for (const l of this._listeners) {
            if (typeof l.snapshot === 'function') {
                try { l.snapshot(snap); } catch (e) { console.error(e); }
            }
        }
    }

    _emitError(err) {
        this._error = err;
        for (const l of this._listeners) {
            if (typeof l.error === 'function') {
                try { l.error(err); } catch (e) { console.error(e); }
            }
        }
    }

    _emitComplete() {
        for (const l of this._listeners) {
            if (typeof l.complete === 'function') {
                try { l.complete(); } catch (e) { console.error(e); }
            }
        }
    }

    on(event, snapshotCb, errorCb, completeCb) {
        if (event !== TaskEvent.STATE_CHANGED) {
            throw new Error('Only STATE_CHANGED is supported');
        }
        const listener = { snapshot: snapshotCb, error: errorCb, complete: completeCb };
        this._listeners.push(listener);
        // immediately call snapshot with current state
        if (snapshotCb) {
            try { snapshotCb(new UploadSnapshot(this._bytesTransferred, this._totalBytes, this._state, this.ref, this._serverResponse)); } catch (e) {/* ignore */ }
        }
        // return unsubscribe
        return () => {
            const i = this._listeners.indexOf(listener);
            if (i >= 0) this._listeners.splice(i, 1);
        };
    }

    _start() {
        // Start upload (or resume). Implemented with XHR for progress and abort.
        this._state = TaskState.RUNNING;
        this._aborted = false;
        this._xhr = new XMLHttpRequest();
        const url = `${this.baseUrl}/upload?path=${encodeURIComponent(this.ref.fullPath)}`;
        this._xhr.open('POST', url, true);

        // Auth header if provided
        const token = this.getAuthToken && this.getAuthToken();
        if (token) {
            this._xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // We can send metadata as header, or as part of formdata
        const form = new FormData();
        form.append('file', this.file);
        form.append('metadata', JSON.stringify(this.metadata));

        this._xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
                this._bytesTransferred = ev.loaded;
                this._totalBytes = ev.total;
                this._emitSnapshot();
            }
        };

        this._xhr.onerror = (ev) => {
            this._state = TaskState.ERROR;
            this._emitSnapshot();
            const err = new Error('Upload failed (network error)');
            this._emitError(err);
        };

        this._xhr.onabort = () => {
            // considered paused if not intentionally cancelled
            if (this._aborted) {
                // paused or canceled - state already set by caller
                this._emitSnapshot();
            } else {
                this._state = TaskState.PAUSED;
                this._emitSnapshot();
            }
        };

        this._xhr.onload = () => {
            if (this._xhr.status >= 200 && this._xhr.status < 300) {
                // success
                this._state = TaskState.SUCCESS;
                try {
                    this._serverResponse = JSON.parse(this._xhr.responseText || '{}');
                } catch (e) {
                    this._serverResponse = { raw: this._xhr.responseText };
                }
                // set bytesTransferred to total
                this._bytesTransferred = this._totalBytes;
                this._emitSnapshot();
                this._emitComplete();
            } else {
                this._state = TaskState.ERROR;
                const err = new Error(`Upload failed: ${this._xhr.status} ${this._xhr.statusText}`);
                err.status = this._xhr.status;
                try { err.body = JSON.parse(this._xhr.responseText || ''); } catch (e) { }
                this._emitError(err);
            }
        };

        this._xhr.send(form);
        this._emitSnapshot();
    }

    pause() {
        if (!this._xhr) return;
        if (this._state !== TaskState.RUNNING) return;
        this._aborted = true;
        try { this._xhr.abort(); } catch (e) { }
        this._state = TaskState.PAUSED;
        this._emitSnapshot();
    }

    resume() {
        if (this._state !== TaskState.PAUSED) return;
        // restart upload from scratch
        this._start();
    }

    cancel() {
        if (!this._xhr) return;
        this._aborted = true;
        try { this._xhr.abort(); } catch (e) { }
        this._state = TaskState.ERROR;
        const err = new Error('Upload canceled by user');
        err.code = 'storage/canceled';
        this._emitError(err);
    }

    // snapshot.ref.getDownloadURL()
    snapshotRefGetDownloadURL() {
        // server response should include publicUrl or downloadUrl
        if (this._serverResponse && this._serverResponse.publicUrl) {
            return Promise.resolve(this._serverResponse.publicUrl);
        }
        // fallback to an endpoint that returns metadata including url
        const url = `${this.baseUrl}/metadata?path=${encodeURIComponent(this.ref.fullPath)}`;
        const token = this.getAuthToken && this.getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { headers }).then(res => {
            if (!res.ok) throw new Error(`Failed to get metadata: ${res.status}`);
            return res.json();
        }).then(json => {
            if (json.publicUrl) return json.publicUrl;
            throw new Error('No publicUrl in response');
        });
    }
}

export class StorageRef {
    constructor(fullPath, baseUrl, getAuthToken) {
        this.fullPath = fullPath.replace(/^\/+/, '');
        this.baseUrl = baseUrl;
        this.getAuthToken = getAuthToken;
    }

    put(file, metadata) {
        const task = new UploadTask(this, file, metadata, this.baseUrl, this.getAuthToken);

        // still allow event-based tracking
        task.snapshot = {
            ref: {
                getDownloadURL: () => task.snapshotRefGetDownloadURL()
            }
        };

        // Wrap the task in a Promise that resolves when upload completes
        return new Promise((resolve, reject) => {
            task.on(
                TaskEvent.STATE_CHANGED,
                null,
                (err) => reject(err),
                () => {
                    const snap = new UploadSnapshot(
                        task._bytesTransferred,
                        task._totalBytes,
                        task._state,
                        task.ref,
                        task._serverResponse
                    );
                    resolve(snap);
                }
            );
        });
    }

    delete() {
        const url = `${this.baseUrl}/delete?path=${encodeURIComponent(this.fullPath)}`;
        const token = this.getAuthToken && this.getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { method: 'DELETE', headers }).then(res => {
            if (!res.ok) throw new Error(`Failed to delete file: ${res.status}`);
            return res.json().catch(() => ({}));
        });
    }
}

export function createClientStorage({
    baseUrl = '/api/storage',
    getAuthToken = null
} = {}) {
    baseUrl = baseUrl.replace(/\/+$/, '');
    return {
        ref: (path) => new StorageRef(path, baseUrl, getAuthToken),

        refFromFile: (fileUrl) => {
            if (typeof fileUrl !== 'string' || !/^https?:\/\//i.test(fileUrl)) {
                throw new Error('refFromFile() expects a valid HTTP or HTTPS URL');
            }

            try {
                const parsed = new URL(fileUrl);
                // Extract path after `/files/` or fallback to pathname
                let path = parsed.pathname;
                // Common convention: https://api.example.com/files/<path>
                const filesIdx = path.indexOf('/files/');
                if (filesIdx >= 0) {
                    path = path.slice(filesIdx + '/files/'.length);
                } else {
                    // Remove leading slash if not using /files/ convention
                    path = path.replace(/^\/+/, '');
                }
                return new StorageRef(path, baseUrl, getAuthToken);
            } catch (err) {
                throw new Error(`Invalid URL: ${fileUrl}`);
            }
        }
    };
}

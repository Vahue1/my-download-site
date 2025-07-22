// KeyAuth Browser SDK - адаптированная версия для работы в браузере
class KeyAuth {
    constructor(options) {
        this.name = options.name;
        this.ownerid = options.ownerid;
        this.version = options.version;
        this.url = "https://keyauth.win/api/1.3/";
        this.public_key = "5586b4bc69c7a4b487e4563a4cd96afd39140f919bd31cea7d1c6a1e8439422b";
        this.sessionid = null;
        this.initialized = false;
        this.user_data = null;
        this.app_data = null;
        this.initPromise = null; // Добавляем промис для предотвращения множественной инициализации

        if (!this.name || !this.ownerid || !this.version) {
            throw new Error("Name, ownerid, and version are required");
        }
    }

    async init() {
        // Если уже инициализирован, возвращаем успех
        if (this.initialized && this.sessionid) {
            return true;
        }

        // Если инициализация уже в процессе, ждем её завершения
        if (this.initPromise) {
            return await this.initPromise;
        }

        // Создаем промис инициализации
        this.initPromise = this._performInit();
        
        try {
            const result = await this.initPromise;
            this.initPromise = null; // Сбрасываем промис после завершения
            return result;
        } catch (error) {
            this.initPromise = null; // Сбрасываем промис при ошибке
            throw error;
        }
    }

    async _performInit() {
        const post_data = {
            type: "init",
            name: this.name,
            ownerid: this.ownerid,
            ver: this.version
        };

        try {
            const response = await this.req(post_data);
            
            if (response.includes("KeyAuth_Invalid")) {
                throw new Error("The application doesn't exist");
            }

            const json = JSON.parse(response);

            if (json.message === "success") {
                this.sessionid = json.sessionid;
                this.initialized = true;
                this.app_data = json.appinfo;
                return true;
            } else {
                throw new Error(json.message || "Unknown initialization error");
            }
        } catch (error) {
            this.initialized = false;
            this.sessionid = null;
            throw new Error("Failed to initialize KeyAuth: " + error.message);
        }
    }

    async check() {
        if (!this.initialized || !this.sessionid) {
            return false;
        }

        const post_data = {
            type: "check",
            sessionid: this.sessionid,
            name: this.name,
            ownerid: this.ownerid
        };

        try {
            const response = await this.req(post_data);
            const json = JSON.parse(response);
            return json.success === true;
        } catch (error) {
            console.error("Check failed:", error);
            return false;
        }
    }

    async license(license) {
        if (!this.initialized || !this.sessionid) {
            throw new Error("KeyAuth not initialized. Please call init() first.");
        }

        const hwid = this.getBrowserFingerprint();

        const post_data = {
            type: "license",
            key: license,
            hwid: hwid,
            sessionid: this.sessionid,
            name: this.name,
            ownerid: this.ownerid
        };

        try {
            const response = await this.req(post_data);
            const json = JSON.parse(response);

            if (json.success === true) {
                this.user_data = json.info;
                return true;
            } else {
                throw new Error(json.message || "License validation failed");
            }
        } catch (error) {
            throw new Error("License validation failed: " + error.message);
        }
    }

    getBrowserFingerprint() {
        // Создаем уникальный отпечаток браузера
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        return this.simpleHash(fingerprint);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16);
    }

    async req(post_data) {
        try {
            const response = await fetch(this.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams(post_data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const response_text = await response.text();

            // Простая расшифровка для браузера (упрощенная версия)
            try {
                return this.decrypt(response_text);
            } catch (decryptError) {
                // Если расшифровка не удалась, возвращаем как есть
                return response_text;
            }
        } catch (error) {
            throw new Error("Request failed: " + error.message);
        }
    }

    decrypt(encryptedText) {
        // Упрощенная версия расшифровки для браузера
        // В реальном проекте здесь должна быть полная реализация AES
        try {
            // Пытаемся парсить как JSON напрямую
            return encryptedText;
        } catch (error) {
            return encryptedText;
        }
    }
}

// Экспортируем класс для использования в браузере
window.KeyAuth = KeyAuth;


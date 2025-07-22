// Windows XP Style Application with KeyAuth Integration
class WindowsXPApp {
    constructor() {
        this.keyAuthApp = null;
        this.isAuthenticated = false;
        this.logEntries = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateTime();
        this.addLogEntry("Система готова к работе. Введите ключ лицензии для активации.");
        // Инициализируем KeyAuth после полной загрузки DOM
        await this.initializeKeyAuth();
    }

    setupEventListeners() {
        // Start button functionality
        const startButton = document.getElementById('startButton');
        const startMenu = document.getElementById('startMenu');
        
        startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Close start menu when clicking outside
        document.addEventListener('click', () => {
            startMenu.style.display = 'none';
        });

        // Window controls
        document.querySelector('.minimize-btn').addEventListener('click', () => {
            this.minimizeWindow();
        });

        document.querySelector('.maximize-btn').addEventListener('click', () => {
            this.maximizeWindow();
        });

        document.querySelector('.close-btn').addEventListener('click', () => {
            this.closeWindow();
        });

        // Key input and validation
        const keyInput = document.getElementById('keyInput');
        const validateButton = document.getElementById('validateButton');
        const downloadButton = document.getElementById('downloadButton');
        validateButton.disabled = true; // Изначально кнопка неактивна

        validateButton.addEventListener('click', () => {
            this.validateKey();
        });

        keyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateKey();
            }
        });

        keyInput.addEventListener('input', (e) => {
            const key = e.target.value.trim();
            if (key.length === 0) {
                downloadButton.disabled = true;
                this.updateConnectionStatus('Не активировано');
            }
        });

        downloadButton.addEventListener('click', () => {
            this.downloadFile();
        });

        // Menu items hover effects
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                this.addLogEntry(`Выбрано меню: ${item.textContent}`, 'info');
            });
        });

        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const actions = ['Назад', 'Вперед', 'Домой', 'Обновить'];
                this.addLogEntry(`Нажата кнопка: ${actions[index] || 'Неизвестно'}`, 'info');
            });
        });

        // Start menu items
        document.querySelectorAll('.start-item').forEach(item => {
            item.addEventListener('click', () => {
                this.addLogEntry(`Запуск: ${item.textContent}`, 'info');
                document.getElementById('startMenu').style.display = 'none';
            });
        });
    }

    async initializeKeyAuth() {
        try {
            // KeyAuth configuration from user
            this.keyAuthApp = new KeyAuth({
                name: "LagsW",
                ownerid: "eUWzEydXbQ", 
                version: "1.2.1"
            });

            const success = await this.keyAuthApp.init();
            if (success) {
                this.addLogEntry("✅ KeyAuth успешно инициализирован", "success");
                this.updateConnectionStatus("Готов к активации");
                document.getElementById("validateButton").disabled = false; // Активируем кнопку "Проверить"
            } else {
                throw new Error("Initialization failed");
            }
        } catch (error) {
            this.addLogEntry(`❌ Ошибка инициализации KeyAuth: ${error.message}`, 'error');
            this.updateConnectionStatus('Ошибка подключения');
        }
    }

    async validateKey() {
        const keyInput = document.getElementById("keyInput");
        const validateButton = document.getElementById("validateButton");
        const downloadButton = document.getElementById("downloadButton");
        
        const key = keyInput.value.trim();
        
        if (!key) {
            this.addLogEntry("Введите ключ лицензии", "error");
            return;
        }

        // Убедимся, что KeyAuth инициализирован
        if (!this.keyAuthApp || !this.keyAuthApp.initialized) {
            this.addLogEntry("❌ KeyAuth не инициализирован. Пожалуйста, подождите или перезагрузите страницу.", "error");
            return;
        }

        validateButton.disabled = true;
        validateButton.textContent = "Проверка...";
        this.addLogEntry(`Проверка ключа: ${key}`, "info");
        this.updateConnectionStatus("Проверка ключа...");

        try {
            await this.keyAuthApp.license(key);
            
            // Check if session is valid
            const isValid = await this.keyAuthApp.check();
            
            if (isValid) {
                this.isAuthenticated = true;
                downloadButton.disabled = false;
                this.addLogEntry("✅ Ключ действителен! Доступ разрешен.", "success");
                this.updateConnectionStatus("Активировано");
                
                // Show user info if available
                if (this.keyAuthApp.user_data) {
                    this.addLogEntry(`Пользователь: ${this.keyAuthApp.user_data.username || "Неизвестно"}`, "info");
                }
            } else {
                throw new Error("Недействительная сессия");
            }
        } catch (error) {
            this.isAuthenticated = false;
            downloadButton.disabled = true;
            this.addLogEntry(`❌ Ошибка: ${error.message}`, "error");
            this.updateConnectionStatus("Ошибка активации");
        } finally {
            validateButton.disabled = false;
            validateButton.textContent = "Проверить";
        }
    }

    downloadFile() {
        if (!this.isAuthenticated) {
            this.addLogEntry('❌ Доступ запрещен. Активируйте лицензию.', 'error');
            return;
        }

        this.addLogEntry('📥 Начинается загрузка защищенного файла...', 'info');

        // Create sample protected file
        const fileContent = `
=== ЗАЩИЩЕННЫЙ ФАЙЛ LagsW ===
Дата создания: ${new Date().toLocaleString('ru-RU')}
Лицензия активирована: ${this.isAuthenticated ? 'Да' : 'Нет'}
Пользователь: ${this.keyAuthApp?.user_data?.username || 'Неизвестно'}

Этот файл был успешно загружен после проверки лицензии KeyAuth.

Содержимое:
- Конфигурационные файлы
- Дополнительные ресурсы
- Документация
- Примеры использования

Спасибо за использование LagsW!

=== КОНЕЦ ФАЙЛА ===
        `.trim();

        const blob = new Blob([fileContent], { type: 'text/plain; charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `LagsW_Protected_File_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.addLogEntry('✅ Файл успешно загружен!', 'success');
    }

    addLogEntry(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        const logEntry = { timestamp, message, type };
        this.logEntries.push(logEntry);
        
        const statusLog = document.getElementById('statusMessage');
        const entryDiv = document.createElement('div');
        entryDiv.className = `log-entry ${type}`;
        
        entryDiv.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">${message}</span>
        `;
        
        statusLog.appendChild(entryDiv);
        statusLog.scrollTop = statusLog.scrollHeight;
        
        // Keep only last 50 entries
        if (this.logEntries.length > 50) {
            this.logEntries.shift();
            statusLog.removeChild(statusLog.firstChild);
        }
    }

    updateConnectionStatus(status) {
        const connectionStatus = document.getElementById('connectionStatus');
        connectionStatus.textContent = `Подключение: ${status}`;
    }

    updateTime() {
        const updateTimeDisplay = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            document.getElementById('timeDisplay').textContent = timeString;
            document.getElementById('taskbarTime').textContent = timeString;
        };
        
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 1000);
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('startMenu');
        const isVisible = startMenu.style.display === 'block';
        startMenu.style.display = isVisible ? 'none' : 'block';
    }

    minimizeWindow() {
        const window = document.querySelector('.window');
        window.style.transform = 'translate(-50%, 100%) scale(0.1)';
        window.style.opacity = '0';
        
        setTimeout(() => {
            window.style.display = 'none';
            this.addLogEntry('Окно свернуто', 'info');
        }, 300);
        
        // Restore after 2 seconds for demo
        setTimeout(() => {
            window.style.display = 'flex';
            window.style.transform = 'translate(-50%, -50%) scale(1)';
            window.style.opacity = '1';
            this.addLogEntry('Окно восстановлено', 'info');
        }, 2000);
    }

    maximizeWindow() {
        const window = document.querySelector('.window');
        const isMaximized = window.style.width === '100%';
        
        if (isMaximized) {
            window.style.width = '90%';
            window.style.height = '85%';
            window.style.maxWidth = '900px';
            this.addLogEntry('Окно восстановлено', 'info');
        } else {
            window.style.width = '100%';
            window.style.height = '100%';
            window.style.maxWidth = 'none';
            this.addLogEntry('Окно развернуто', 'info');
        }
    }

    closeWindow() {
        if (confirm('Вы действительно хотите закрыть приложение?')) {
            const window = document.querySelector('.window');
            window.style.transform = 'translate(-50%, -50%) scale(0)';
            window.style.opacity = '0';
            
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        background: linear-gradient(to bottom, #0054e3 0%, #40a6ff 50%, #0054e3 100%);
                        color: white;
                        font-family: Tahoma, sans-serif;
                        text-align: center;
                    ">
                        <div>
                            <h1>💻 LagsW</h1>
                            <p>Приложение закрыто</p>
                            <button onclick="location.reload()" style="
                                margin-top: 20px;
                                padding: 8px 16px;
                                background: #ece9d8;
                                border: 2px outset #ece9d8;
                                cursor: pointer;
                                font-family: Tahoma, sans-serif;
                            ">Перезапустить</button>
                        </div>
                    </div>
                `;
            }, 300);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.xpApp = new WindowsXPApp();
});

// Add some Windows XP sound effects simulation
function playSystemSound(type) {
    // Create audio context for system sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const sounds = {
        startup: [800, 600, 400],
        error: [300, 200, 100],
        success: [400, 600, 800],
        click: [1000]
    };
    
    const frequencies = sounds[type] || [500];
    
    frequencies.forEach((freq, index) => {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        }, index * 100);
    });
}

// Add click sounds to buttons
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        playSystemSound('click');
    }
});

// Prevent context menu for authentic XP feel
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + F4 to close
    if (e.altKey && e.key === 'F4') {
        e.preventDefault();
        window.xpApp?.closeWindow();
    }
    
    // Windows key to toggle start menu
    if (e.key === 'Meta' || e.key === 'OS') {
        e.preventDefault();
        window.xpApp?.toggleStartMenu();
    }
    
    // F5 to refresh
    if (e.key === 'F5') {
        e.preventDefault();
        location.reload();
    }
});


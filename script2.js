/**
 * Catatan Refactoring:
 * Kode ini telah di-refactor untuk mengikuti prinsip Clean Code dengan memisahkan
 * tanggung jawab (Separation of Concerns) menjadi beberapa bagian utama:
 * 1. CONFIG & STATE: Mengelola semua data dan konfigurasi aplikasi.
 * 2. SERVICES: Mengelola logika bisnis murni (manipulasi data).
 * 3. UI MANAGER: Mengelola semua interaksi dengan DOM (rendering).
 * 4. EVENT HANDLERS: Menangani semua input dari pengguna.
 * 5. INITIALIZATION: Titik masuk utama aplikasi.
 *
 * Pola ini membuat kode lebih modular, mudah dibaca, dan dikelola.
 */
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. KONFIGURASI & STATE APLIKASI
    // =================================================================

    /**
     * @description Objek untuk menampung semua selektor DOM agar mudah dikelola.
     */
    const SELECTORS = {
        // Views & Pages
        pages: '.page',
        editorView: '#editor-view',
        addHabitView: '#add-habit-view',
        habitDetailView: '#habit-detail-view',
        datePickerModal: '#date-picker-modal',
        addMenuOverlay: '#add-menu-overlay',
        addMenuPopup: '#add-menu-popup',
        customReminderPicker: '#custom-reminder-picker',
        pickerInitialView: '#picker-initial-view',
        pickerCalendarView: '#picker-calendar-view',

        // Navigation & Buttons
        navButtons: '.nav-button',
        backButton: '#back-button',
        editNoteButton: '#edit-note-button',
        mainAddButton: '#main-add-button',
        addMenuHabitBtn: '#add-menu-habit-btn',
        addMenuNoteBtn: '#add-menu-note-btn',

        // Notes
        notesList: '#notes-list',
        searchInput: '#search-input',
        noteTitleInput: '#note-title-input',
        noteContentEditor: '#note-content-editor',

        // Reminders
        reminderContainer: '#reminder-container',
        openCalendarBtn: '#open-calendar-btn',
        reminderTimeInput: '#reminder-time-input',
        saveReminderBtn: '#save-reminder-btn',
        cancelReminderBtn: '#cancel-reminder-btn',
        pickerErrorMsg: '#picker-error-msg',
        pickerPrevMonthBtn: '#picker-prev-month-btn',
        pickerNextMonthBtn: '#picker-next-month-btn',
        pickerMonthYearDisplay: '#picker-month-year-display',
        pickerCalendarGrid: '#picker-calendar-grid',
        confirmDateBtn: '#confirm-date-btn',

        // Calendar & Agenda
        monthYearDisplay: '#month-year-display',
        prevMonthBtn: '#prev-month-btn',
        nextMonthBtn: '#next-month-btn',
        calendarGrid: '#calendar-grid',
        agendaDateTitle: '#agenda-date-title',
        agendaList: '#agenda-list',

        // Habits
        habitsEmptyState: '#habits-empty-state',
        addHabitInitialBtn: '#add-habit-initial-btn',
        habitsGridContainer: '#habits-grid-container',
        backFromAddHabitBtn: '#back-from-add-habit-btn',
        saveHabitBtn: '#save-habit-btn',
        addHabitNameInput: '#add-habit-name',
        colorPicker: '#color-picker',
        habitTypeRadios: 'input[name="habit-type"]',
        quantOptions: '#quant-options',
        addHabitUnitInput: '#add-habit-unit',
        addHabitNotesTextarea: '#add-habit-notes',

        // Habit Details
        backFromHabitDetailBtn: '#back-from-habit-detail-btn',
        habitDetailTitle: '#habit-detail-title',
        editHabitBtn: '#edit-habit-btn',
        deleteHabitBtn: '#delete-habit-btn',
        currentStreakValue: '#current-streak-value',
        bestStreakValue: '#best-streak-value',
        heatmapContainer: '#heatmap-container',
        habitDetailNotes: '#habit-detail-notes',
    };

    /**
     * @description Objek untuk menyimpan semua referensi elemen DOM.
     */
    const ui = {};
    for (const key in SELECTORS) {
        ui[key] = document.querySelectorAll(SELECTORS[key]).length > 1 ?
            document.querySelectorAll(SELECTORS[key]) :
            document.querySelector(SELECTORS[key]);
    }

    /**
     * @description State utama aplikasi. Semua data yang berubah disimpan di sini.
     */
    const state = {
        notes: [],
        habits: [],
        currentNoteId: null,
        editingHabitId: null,
        calendarDate: new Date(),
        pickerCalendarDate: new Date(),
        tempReminderDate: null,
        longPressTimer: null,
        isLongPress: false,
        currentListPage: 'notes',
        pageBeforeEditor: 'notes',
    };
    
    let editor;


    // =================================================================
    // 2. SERVICES (Logika Bisnis & Manipulasi Data)
    // =================================================================

    const storageService = {
    saveData() {
        localStorage.setItem('notes-app-data-v3', JSON.stringify({
            notes: state.notes,
            habits: state.habits
        }));
    },

    loadData() {
        const data = JSON.parse(localStorage.getItem('notes-app-data-v3'));
        if (data && data.notes) {
            const migratedNotes = data.notes.map(note => {
                if (note.isArchived === undefined) {
                    note.isArchived = false;
                }
                return note;
            });
            state.notes = migratedNotes;
            state.habits = data.habits || [];
        }
    },

    // --- FUNGSI BARU ---
    exportData() {
        const dataToExport = JSON.stringify({
            notes: state.notes,
            habits: state.habits
        }, null, 2); // null, 2 untuk pretty-print JSON

        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        a.href = url;
        a.download = `pusat_produktivitas_backup_${dateString}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("Data berhasil diekspor.");
    },

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importedData.notes && importedData.habits) {
                    if (confirm("Anda yakin ingin mengimpor data ini? Data saat ini akan ditimpa.")) {
                        state.notes = importedData.notes;
                        state.habits = importedData.habits;
                        this.saveData(); // Simpan data baru ke localStorage
                        // Muat ulang aplikasi untuk menerapkan perubahan
                        alert("Data berhasil diimpor! Aplikasi akan dimuat ulang.");
                        location.reload(); 
                    }
                } else {
                    alert("Format file tidak valid.");
                }
            } catch (error) {
                alert("Gagal membaca file. Pastikan file dalam format JSON yang benar.");
                console.error("Import error:", error);
            }
        };
        reader.readAsText(file);
    },

    autoBackup() {
        const now = new Date().getTime();
        const lastBackupTime = parseInt(localStorage.getItem('lastAutoBackupTime') || '0');
        const twentyFourHours = 24 * 60 * 60 * 1000;

        // Jika sudah lebih dari 24 jam sejak backup terakhir
        if (now - lastBackupTime > twentyFourHours) {
            console.log("Melakukan backup otomatis harian...");
            const dataToBackup = JSON.stringify({
                notes: state.notes,
                habits: state.habits
            });
            // Simpan ke kunci yang berbeda untuk keamanan
            localStorage.setItem('autoBackupData', dataToBackup);
            localStorage.setItem('lastAutoBackupTime', now.toString());
            console.log("Backup otomatis harian selesai.");
        } else {
            console.log("Backup otomatis harian belum diperlukan.");
        }
    }
};

    const notesService = {
        getNoteById: (id) => state.notes.find(note => note.id === id),
   
        archiveExpiredNotes() {
    const now = new Date();
    let notesChanged = false;

    state.notes.forEach(note => {
        // Hanya proses catatan yang belum diarsipkan, tidak di-pin, dan punya reminder
        if (!note.isArchived && !note.pinned && note.reminderTimestamp) {
            const reminderDate = new Date(note.reminderTimestamp);
            
            // Jika tanggal reminder sudah lewat
            if (reminderDate < now) {
                note.isArchived = true;
                notesChanged = true;
            }
        }
    });

    // Simpan data hanya jika ada perubahan
    if (notesChanged) {
        storageService.saveData();
    }
},
        
        saveNote(title, content) {
            if (state.currentNoteId) {
                // Update note yang ada
                const note = this.getNoteById(state.currentNoteId);
                if (note) {
                    note.title = title;
                    note.content = content;
                }
            } else if (title || content) {
                // Buat note baru
                const newNote = {
                    id: Date.now(),
                    title: title || 'Tanpa Judul',
                    content: content,
                    pinned: false,
                    isArchived: false,
                    reminderTimestamp: state.tempReminderDate ? state.tempReminderDate.toISOString() : null,
                };
                state.notes.push(newNote);
            }
            storageService.saveData();
        },
        
        deleteNote(id) {
            state.notes = state.notes.filter(note => note.id !== id);
            storageService.saveData();
        },
        
        togglePin(id) {
            const note = this.getNoteById(id);
            if (note) {
                note.pinned = !note.pinned;
                storageService.saveData();
            }
        },

        setReminder(date) {
            const note = state.currentNoteId ? this.getNoteById(state.currentNoteId) : null;
             if (note) {
                note.reminderTimestamp = date ? date.toISOString() : null;
            } else {
                // Untuk note baru yang belum disimpan
                state.tempReminderDate = date;
            }
            storageService.saveData();
        }
        
        
    };

    const habitsService = {
        getHabitById: (id) => state.habits.find(h => h.id === id),
        
        saveHabit(data) {
            if (state.editingHabitId) {
                // Update habit
                const habit = this.getHabitById(state.editingHabitId);
                if (habit) Object.assign(habit, data);
            } else {
                // Buat habit baru
                const newHabit = { 
                    id: Date.now(),
                    ...data,
                    history: [] 
                };
                state.habits.push(newHabit);
            }
            storageService.saveData();
            state.editingHabitId = null; // Reset
        },
        
        deleteHabit(id) {
            state.habits = state.habits.filter(h => h.id !== id);
            storageService.saveData();
        },

        updateHistory(habit, date, value) {
            const dateString = date.toISOString().split('T')[0];
            let entry = habit.history.find(h => h.date.startsWith(dateString));

            if (entry) {
                if (value === null) { // Menghapus entry Yes/No
                    habit.history = habit.history.filter(h => !h.date.startsWith(dateString));
                } else {
                    entry.value = value;
                }
            } else if (value !== null) {
                habit.history.push({ date: date.toISOString(), value });
            }
            storageService.saveData();
        },

        calculateStreaks(habit) {
    // Helper function untuk menormalkan tanggal ke awal hari (tengah malam)
    const startOfDay = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    if (!habit.history || habit.history.length === 0) return { current: 0, best: 0 };

    // Normalkan semua tanggal di history sebelum diurutkan
    const sortedHistory = habit.history.map(h => startOfDay(h.date)).sort((a, b) => a - b);
    
    // Hapus duplikat tanggal jika ada (kasus check-in beberapa kali sehari)
    const uniqueDates = sortedHistory.filter((date, index, self) =>
        index === self.findIndex(d => d.getTime() === date.getTime())
    );

    let bestStreak = 0, currentStreak = 0;
    if (uniqueDates.length > 0) {
        bestStreak = 1;
        currentStreak = 1;
    }

    for (let i = 1; i < uniqueDates.length; i++) {
        // Perhitungan selisih sekarang akan selalu akurat (kelipatan 24 jam)
        const diffInDays = (uniqueDates[i] - uniqueDates[i - 1]) / 86400000;
        
        if (diffInDays === 1) {
            currentStreak++;
        } else {
            bestStreak = Math.max(bestStreak, currentStreak);
            currentStreak = 1;
        }
    }
    bestStreak = Math.max(bestStreak, currentStreak);
    
    // Pengecekan streak saat ini dengan hari ini
    const today = startOfDay(new Date());
    const lastEntry = uniqueDates[uniqueDates.length - 1];
    const diffFromToday = (today - lastEntry) / 86400000;

    if (diffFromToday > 1) { // Jika sudah lewat lebih dari 1 hari, streak putus
        currentStreak = 0;
    }

    return { current: currentStreak, best: bestStreak };
}
    };
    
    // GANTI SELURUH OBJEK calendarService DENGAN INI
    const calendarService = {
    getNotesForDate(date) {
        // Helper function untuk mengubah tanggal ke format YYYY-MM-DD
        // tanpa terpengaruh oleh konversi timezone UTC.
        const toLocalISOString = (d) => {
            const dt = new Date(d);
            const year = dt.getFullYear();
            const month = (dt.getMonth() + 1).toString().padStart(2, '0');
            const day = dt.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        const targetDateStr = toLocalISOString(date);
        return state.notes.filter(note => {
            if (!note.reminderTimestamp) return false;
            const noteDateStr = toLocalISOString(note.reminderTimestamp);
            return noteDateStr === targetDateStr;
        });
    },

    getDatesWithNotesInMonth(date) {
        // Fungsi ini sudah benar, tidak perlu diubah
        const month = date.getMonth();
        const year = date.getFullYear();
        const datesWithNotes = state.notes
            .filter(note => {
                if (!note.reminderTimestamp) return false;
                const reminderDate = new Date(note.reminderTimestamp);
                return reminderDate.getMonth() === month && reminderDate.getFullYear() === year;
            })
            .map(note => new Date(note.reminderTimestamp).getDate());
        return [...new Set(datesWithNotes)];
    }
};


    // =================================================================
    // 3. UI MANAGER (Manipulasi DOM & Rendering)
    // =================================================================
    
    const uiManager = {
      
        createNoteListItem(note) {
    const li = document.createElement('li');
    li.dataset.id = note.id;
    li.className = note.pinned ? 'pinned' : '';

    // Atur struktur dasar dari list item
    li.innerHTML = `
        <span class="note-title">
            ${note.pinned ? '📌' : ''}
            ${note.title}
        </span>
        <div class="note-widget-area"></div>
        <button class="delete-note-btn">&times;</button>
    `;

    // Logika untuk membuat Progress Chart
    const noteContent = note.content;
    if (noteContent && noteContent.blocks && noteContent.blocks.length > 0) {
        let totalTasks = 0;
        let checkedTasks = 0;
        noteContent.blocks.forEach(block => {
            if (block.type === 'checklist') {
                totalTasks += block.data.items.length;
                checkedTasks += block.data.items.filter(item => item.checked).length;
            }
        });

        if (totalTasks > 0) {
            const progressPercent = (checkedTasks / totalTasks) * 100;
            const progressChart = document.createElement('div');
            progressChart.className = 'progress-chart';
            progressChart.style.setProperty('--progress-percent', `${progressPercent}%`);
            progressChart.innerHTML = `<span>${Math.round(progressPercent)}%</span>`;
            li.querySelector('.note-widget-area').appendChild(progressChart);
        }
    }
    
    // Tambahkan event listener untuk membuka dan menghapus catatan
    li.addEventListener('click', (e) => {
        // Cek jika tombol hapus yang diklik
        if (e.target.closest('.delete-note-btn')) {
            const confirmText = note.isArchived ? 'menghapus catatan ini secara permanen?' : 'memindahkan catatan ini ke arsip?';
            // Logika Hapus atau Arsipkan
            if (confirm(`Anda yakin ingin ${confirmText}`)) {
                 if (note.isArchived) {
                    notesService.deleteNote(note.id); // Hapus permanen dari arsip
                 } else {
                    note.isArchived = true; // Arsipkan dari catatan utama
                    storageService.saveData();
                 }
                 uiManager.renderListPage(); // Render ulang halaman saat ini
            }
        } else if (!state.isLongPress) {
            // Jika bukan tombol hapus, buka editor
            uiManager.openNoteEditor(note);
        }
    });

    return li; // Kembalikan elemen <li> yang sudah jadi
},

        renderListPage() {
    const header = document.getElementById('main-list-header');
    const listContainer = ui.notesList;
    listContainer.innerHTML = '';

    if (state.currentListPage === 'archive') {
        // --- TAMPILAN ARSIP ---
        header.innerHTML = `
            <div class="header-group-left">
                <button id="back-from-archive-btn">&larr;</button>
                <h1>Arsip</h1>
            </div>
        `;
        const archivedNotes = state.notes.filter(note => note.isArchived);
        if (archivedNotes.length > 0) {
            archivedNotes.forEach(note => {
                const noteItem = this.createNoteListItem(note); // Gunakan helper
                listContainer.appendChild(noteItem);
            });
        } else {
            listContainer.innerHTML = `<p class="empty-state">Arsip Anda kosong.</p>`;
        }

    } else {
        // --- TAMPILAN CATATAN (DEFAULT) ---
        header.innerHTML = `
            <div class="header-group-left">
                <h1>Catatan</h1>
            </div>
            <div class="header-group-right">
                <button id="archive-view-btn" title="Lihat Arsip">📑</button>
            </div>
        `;
        const notesToDisplay = state.notes.filter(note => !note.isArchived);
        if (notesToDisplay.length > 0) {
            notesToDisplay.sort((a, b) => b.pinned - a.pinned).forEach(note => {
                const noteItem = this.createNoteListItem(note); // Gunakan helper yang sama
                listContainer.appendChild(noteItem);
            });
        } else {
            listContainer.innerHTML = `<p class="empty-state">Belum ada catatan.</p>`;
        }
    }
},
      
         // Letakkan ini di dalam objek uiManager
        toggleDatePicker(show) {
    const modal = document.getElementById('date-picker-modal');
    if (show) {
        this.populatePickers();
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
},

        populatePickers() {
    const monthScroller = document.getElementById('month-scroller');
    const yearScroller = document.getElementById('year-scroller');
    monthScroller.innerHTML = '';
    yearScroller.innerHTML = '';

    const selectedMonth = state.calendarDate.getMonth();
    const selectedYear = state.calendarDate.getFullYear();

    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    months.forEach((monthName, index) => {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.textContent = monthName;
        item.dataset.month = index;
        if (index === selectedMonth) item.classList.add('selected');
        monthScroller.appendChild(item);
    });

    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1980; year--) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.textContent = year;
        item.dataset.year = year;
        if (year === selectedYear) item.classList.add('selected');
        yearScroller.appendChild(item);
    }

    // Auto-scroll ke item yang terpilih
    monthScroller.querySelector('.selected')?.scrollIntoView({ block: 'center' });
    yearScroller.querySelector('.selected')?.scrollIntoView({ block: 'center' });
},
        
        // --- General UI ---
        applyTheme(theme) {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('theme', theme);

    // Dapatkan tombol baru di halaman pengaturan
    const toggleButton = document.getElementById('theme-toggle-settings');
    if (toggleButton) {
        // Ganti ikon berdasarkan tema yang aktif
        toggleButton.innerHTML = theme === 'light' ? '☀️' : '🌙';
    }
},

        navigateToPage(pageId) {
            ui.pages.forEach(page => page.classList.remove('active'));
            ui.navButtons.forEach(button => button.classList.remove('active'));
            
            const targetPage = document.getElementById(`page-${pageId}`);
            if (targetPage) targetPage.classList.add('active');
            
            const targetButton = document.querySelector(`.nav-button[data-page="${pageId}"]`);
            if (targetButton) targetButton.classList.add('active');
        },

        showView(element) { element.classList.add('active'); },
        hideView(element) { element.classList.remove('active'); },
        toggleMenu(show) {
            ui.addMenuOverlay.classList.toggle('hidden', !show);
            ui.addMenuPopup.classList.toggle('hidden', !show);
        },

        // --- Notes UI ---
        renderNotes(query = '') {
    const lowerCaseQuery = query.toLowerCase();
    const filteredNotes = state.notes
        .filter(note => !note.isArchived)
        .filter(note => note.title.toLowerCase().includes(lowerCaseQuery))
        .sort((a, b) => b.pinned - a.pinned || b.id - a.id);

    ui.notesList.innerHTML = '';
    if (filteredNotes.length === 0) {
        ui.notesList.innerHTML = `<p class="empty-state">${query ? 'Catatan tidak ditemukan.' : 'Belum ada catatan.'}</p>`;
        return;
    }

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.id = note.id;
        li.className = note.pinned ? 'pinned' : '';

        // Atur struktur dasar dari list item
        li.innerHTML = `
            <span class="note-title">
                ${note.pinned ? '📌' : ''}
                ${note.title}
            </span>
            <div class="note-widget-area">
                </div>
            <button class="delete-note-btn" data-action="delete">&times;</button>
        `;

        // --- BAGIAN YANG DIUBAH: Membuat Progress Chart ---
        const noteContent = note.content;
        if (noteContent && noteContent.blocks && noteContent.blocks.length > 0) {
            let totalTasks = 0;
            let checkedTasks = 0;

            noteContent.blocks.forEach(block => {
                if (block.type === 'checklist') {
                    totalTasks += block.data.items.length;
                    checkedTasks += block.data.items.filter(item => item.checked).length;
                }
            });

            // Hanya buat chart jika ada setidaknya satu task
            if (totalTasks > 0) {
                const progressPercent = (checkedTasks / totalTasks) * 100;
                
                // Buat elemen div untuk chart
                const progressChart = document.createElement('div');
                progressChart.className = 'progress-chart';
                
                // Atur CSS variable untuk conic-gradient
                progressChart.style.setProperty('--progress-percent', `${progressPercent}%`);
                
                // Tambahkan teks di dalam chart (opsional, bisa persentase atau rasio)
                progressChart.innerHTML = `<span>${Math.round(progressPercent)}%</span>`;
                
                // Masukkan chart ke dalam area widget
                li.querySelector('.note-widget-area').appendChild(progressChart);
            }
        }
        
        // Tambahkan event listener untuk membuka dan menghapus catatan
        li.addEventListener('click', (e) => {
            if (e.target.closest('.delete-note-btn')) {
                if (confirm('Hapus catatan ini?')) {
                    notesService.deleteNote(note.id);
                    this.renderNotes(ui.searchInput.value);
                }
            } else if (!state.isLongPress) {
                uiManager.openNoteEditor(note);
            }
        });

        ui.notesList.appendChild(li);
    });
},
        
        openNoteEditor(note = null) {
    state.currentNoteId = note ? note.id : null;
    ui.noteTitleInput.value = note ? note.title : '';

    // --- LOGIKA BARU ---
    // 1. Selalu mulai dalam mode BACA
    ui.noteTitleInput.readOnly = true; // Judul tidak bisa diedit
    ui.editNoteButton.classList.remove('hidden'); // Tampilkan tombol "Edit"

    // Hancurkan instance editor lama jika ada
    if (editor) {
        editor.destroy();
        editor = null;
    }

    // 2. Render konten sebagai HTML statis, BUKAN instance Editor.js
    const contentToShow = (note && note.content) ? this.renderNoteContentAsHtml(note.content) : '<p><i>Klik Edit untuk mulai menulis...</i></p>';
    ui.noteContentEditor.innerHTML = contentToShow;

    // 3. Tampilkan halaman editor
    this.renderReminderUI(note);
    this.showView(ui.editorView);
},

        closeNoteEditor() {
            this.hideView(ui.editorView);
            state.currentNoteId = null;
        },

        

        // --- Reminder UI ---
        // Di dalam objek uiManager, GANTI fungsi ini
        renderReminderUI(note) {
    ui.reminderContainer.innerHTML = '';
    
    // PENANDA BARU: Kita tentukan mode edit berdasarkan apakah judul bisa diubah atau tidak.
    const isEditing = !ui.noteTitleInput.readOnly; 
    
    const noteData = note || { reminderTimestamp: state.tempReminderDate };

    // Jangan tampilkan apa-apa di mode baca jika tidak ada reminder
    if (!isEditing && !noteData.reminderTimestamp) return;

    if (noteData.reminderTimestamp) {
        const chip = document.createElement('div');
        chip.className = 'reminder-chip';
        const reminderDate = new Date(noteData.reminderTimestamp);
        const formattedDate = reminderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        chip.textContent = `⏰ ${formattedDate}`;

        // Hanya buat interaktif jika sedang dalam mode edit
        if (isEditing) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-reminder-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.dataset.action = 'remove-reminder';
            chip.appendChild(removeBtn);
            chip.dataset.action = 'edit-reminder';
        }
        ui.reminderContainer.appendChild(chip);
    } else if (isEditing) { // Hanya tampilkan tombol tambah jika sedang mode edit
        const addButton = document.createElement('button');
        addButton.className = 'add-reminder-btn';
        addButton.textContent = '➕ Tambah Pengingat';
        addButton.dataset.action = 'add-reminder';
        ui.reminderContainer.appendChild(addButton);
    }
},

        toggleReminderPicker(show) {
            ui.customReminderPicker.classList.toggle('active', show);
            ui.reminderContainer.style.display = show ? 'none' : 'block';
            if(show) this.switchToPickerView('initial');
        },

        switchToPickerView(viewName) {
            const isCalendar = viewName === 'calendar';
            ui.pickerInitialView.classList.toggle('active', !isCalendar);
            ui.pickerCalendarView.classList.toggle('active', isCalendar);
            if(isCalendar) this.renderPickerCalendar();
        },

        renderPickerCalendar() {
             // Fungsi ini sudah cukup baik, hanya disesuaikan sedikit
            const grid = ui.pickerCalendarGrid;
            grid.innerHTML = '';
            const date = state.pickerCalendarDate;
            const month = date.getMonth();
            const year = date.getFullYear();

            ui.pickerMonthYearDisplay.textContent = `${date.toLocaleDateString('id-ID', { month: 'long' })} ${year}`;
            
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDayOfMonth; i++) {
                grid.appendChild(document.createElement('div'));
            }

            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = i;
                dayCell.dataset.day = i;
                
                if (state.tempReminderDate && i === state.tempReminderDate.getDate() && month === state.tempReminderDate.getMonth() && year === state.tempReminderDate.getFullYear()) {
                    dayCell.classList.add('selected');
                }
                grid.appendChild(dayCell);
            }
        },

        updateReminderDateDisplay() {
            if (state.tempReminderDate) {
                const span = ui.openCalendarBtn.querySelector('span');
                span.textContent = state.tempReminderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            }
        },
        
        // --- Calendar & Agenda UI ---
        renderCalendar() {
    const grid = ui.calendarGrid;
    const date = state.calendarDate;
    const month = date.getMonth();
    const year = date.getFullYear();

    ui.monthYearDisplay.textContent = `${date.toLocaleDateString('id-ID', { month: 'long' })} ${year}`;
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Panggil service untuk mendapatkan tanggal yang ada catatannya di bulan ini
    const datesWithNotes = calendarService.getDatesWithNotesInMonth(date);

    grid.innerHTML = ''; // Kosongkan grid sebelum diisi

    // Tambahkan sel kosong untuk hari sebelum tanggal 1
    for (let i = 0; i < firstDayOfMonth; i++) {
        grid.appendChild(document.createElement('div'));
    }

    // Buat sel untuk setiap tanggal
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        // Simpan tanggal penuh untuk kemudahan nanti
        dayCell.dataset.date = new Date(year, month, i).toISOString(); 
        dayCell.innerHTML = `<span>${i}</span>`;
        
        // Cek apakah tanggal ini ada di dalam daftar tanggal yang punya catatan
        if (datesWithNotes.includes(i)) {
            dayCell.innerHTML += '<div class="note-indicator"></div>';
        }
        
        // Tandai hari ini
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('current-day');
        }
        grid.appendChild(dayCell);
    }
},
 
        renderAgenda(date) {
    ui.agendaDateTitle.textContent = `Jadwal untuk ${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    
    const notesForDay = calendarService.getNotesForDate(date);
    ui.agendaList.innerHTML = '';

    if (notesForDay.length === 0) {
        ui.agendaList.innerHTML = '<p class="empty-state">Tidak ada jadwal untuk hari ini.</p>';
        return;
    }

    notesForDay.forEach(note => {
        const item = document.createElement('div');
        item.className = 'agenda-item';
        
        const timeStr = new Date(note.reminderTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
        // Mengubah data JSON menjadi teks biasa untuk pratinjau
        let previewText = 'Catatan ini berisi blok interaktif.';
        if (note.content && note.content.blocks) {
            const firstParagraph = note.content.blocks.find(block => block.type === 'paragraph');
            if (firstParagraph) {
                previewText = firstParagraph.data.text.substring(0, 100); // Batasi 100 karakter
            }
        }

        item.innerHTML = `
            <div class="agenda-time">${timeStr}</div>
            <div class="agenda-details">
                <h4>${note.title}</h4>
                <p>${previewText}</p>
            </div>
            <button class="agenda-read-more" data-id="${note.id}">lihat selengkapnya</button>
        `;
        ui.agendaList.appendChild(item);
    });
},
        
        // --- Habits UI ---
        renderHabitsPage() {
            const hasHabits = state.habits.length > 0;
            ui.habitsEmptyState.style.display = hasHabits ? 'none' : 'block';
            ui.habitsGridContainer.style.display = hasHabits ? 'grid' : 'none';
            if (hasHabits) this.renderHabitsGrid();
        },

        renderHabitsGrid() {
            const grid = ui.habitsGridContainer;
            grid.innerHTML = '';

            // Create date headers
            const dates = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });

            grid.appendChild(document.createElement('div')); // Empty corner
            const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            dates.forEach(date => {
                const headerCell = document.createElement('div');
                headerCell.className = 'grid-header-cell';
                headerCell.innerHTML = `<span>${dayNames[date.getDay()]}</span><span>${date.getDate()}</span>`;
                grid.appendChild(headerCell);
            });

            // Create habit rows
            state.habits.forEach(habit => {
                const nameCell = document.createElement('div');
                nameCell.className = 'grid-habit-name';
                nameCell.dataset.id = habit.id;
                nameCell.innerHTML = `<span class="color-dot" style="background-color: ${habit.color};"></span> ${habit.name}`;
                grid.appendChild(nameCell);

                dates.forEach(date => {
                    const dataCell = document.createElement('div');
                    dataCell.className = 'grid-data-cell';
                    dataCell.dataset.id = habit.id;
                    dataCell.dataset.date = date.toISOString();
                    
                    const entry = habit.history.find(h => h.date.startsWith(date.toISOString().split('T')[0]));
                    if (entry) {
                        dataCell.innerHTML = habit.type === 'yesno'
                            ? `<span style="color: ${habit.color};">${entry.value === 1 ? '✓' : '×'}</span>`
                            : `<span>${entry.value}</span><span class="unit">${habit.unit}</span>`;
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        dataCell.classList.add('today');
                    }
                    grid.appendChild(dataCell);
                });
            });
        },

        openAddHabitView(habit = null) {
            state.editingHabitId = habit ? habit.id : null;
            ui.addHabitNameInput.value = habit ? habit.name : '';
            ui.addHabitNotesTextarea.value = habit ? habit.notes : '';
            ui.addHabitUnitInput.value = (habit && habit.unit) ? habit.unit : '';
            
            // Reset and set color
            ui.colorPicker.querySelector('.active')?.classList.remove('active');
            const colorEl = ui.colorPicker.querySelector(`[data-color="${habit ? habit.color : '#e57373'}"]`);
            if(colorEl) colorEl.classList.add('active');

            // Set type
            const type = habit ? habit.type : 'yesno';
            document.getElementById(type === 'yesno' ? 'type-yesno' : 'type-quant').checked = true;
            ui.quantOptions.classList.toggle('hidden', type !== 'quantifiable');

            this.showView(ui.addHabitView);
        },
        
        renderHeatmap(habit) {
    ui.heatmapContainer.innerHTML = '';

    // Helper function untuk mengubah tanggal ke format YYYY-MM-DD lokal (aman dari timezone)
    const toLocalISOString = (d) => {
        const dt = new Date(d);
        const year = dt.getFullYear();
        const month = (dt.getMonth() + 1).toString().padStart(2, '0');
        const day = dt.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'heatmap-scroll-wrapper';

    const historyMap = new Map();
    if (habit.history) {
        habit.history.forEach(entry => {
            // Gunakan helper function yang sama untuk data history
            const dateStr = toLocalISOString(entry.date);
            historyMap.set(dateStr, entry.value);
        });
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    // Loop untuk setiap bulan dalam setahun
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'heatmap-month-container';
        monthContainer.id = `heatmap-month-${month}`;

        const monthLabel = document.createElement('div');
        monthLabel.className = 'heatmap-month-label';
        monthLabel.textContent = monthNames[month];
        monthContainer.appendChild(monthLabel);

        const grid = document.createElement('div');
        grid.className = 'heatmap-grid';

        const firstDayOfMonth = new Date(currentYear, month, 1);
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();

        // Tambahkan sel kosong untuk hari sebelum tanggal 1
        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            const spacer = document.createElement('div');
            spacer.style.width = '20px';
            spacer.style.height = '20px';
            grid.appendChild(spacer);
        }

        // Tambahkan sel untuk setiap hari dalam bulan
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';

            const currentDate = new Date(currentYear, month, day);
            // --- INI BAGIAN PENTING YANG DIPERBAIKI ---
            // Gunakan helper function untuk mendapatkan string tanggal yang benar
            const dateString = toLocalISOString(currentDate); 
            const value = historyMap.get(dateString);

            if (value !== undefined) {
                // Atur warna berdasarkan nilai (leveling sederhana)
                let opacity = Math.min(0.3 + (value / 5) * 0.7, 1);
                cell.style.backgroundColor = habit.color;
                cell.style.opacity = opacity;
            }
            
            // Tooltip untuk menampilkan info
            const tooltipText = `${currentDate.toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long'})}: ${value !== undefined ? value + (habit.unit || 'x') : 'Tidak ada'}`;
            cell.innerHTML = `<span class="tooltip">${tooltipText}</span>`;
            
            grid.appendChild(cell);
        }
        
        monthContainer.appendChild(grid);
        wrapper.appendChild(monthContainer);
    }

    ui.heatmapContainer.appendChild(wrapper);

    // Otomatis scroll ke bulan saat ini
    const currentMonthEl = document.getElementById(`heatmap-month-${today.getMonth()}`);
    if (currentMonthEl) {
        wrapper.scrollLeft = currentMonthEl.offsetLeft;
    }
},
        
        showHabitDetail(habit) {
            const streaks = habitsService.calculateStreaks(habit);
            ui.habitDetailView.dataset.activeHabitId = habit.id;
            ui.habitDetailTitle.textContent = habit.name;
            ui.currentStreakValue.textContent = streaks.current;
            ui.bestStreakValue.textContent = streaks.best;
            ui.habitDetailNotes.textContent = habit.notes || "Tidak ada catatan.";
            
            // Panggil fungsi renderHeatmap yang baru kita buat
            this.renderHeatmap(habit); 
            
            this.showView(ui.habitDetailView);
        },

        // Fungsi untuk mengubah data JSON Editor.js menjadi HTML read-only
        renderNoteContentAsHtml(content) {
    if (!content || !content.blocks || content.blocks.length === 0) {
        return '<p><i>Catatan ini kosong.</i></p>';
    }

    let html = '';
    content.blocks.forEach((block, blockIndex) => { // Tambahkan blockIndex
        switch (block.type) {
            case 'paragraph':
                html += `<p>${block.data.text}</p>`;
                break;
            case 'checklist':
                html += '<div class="checklist-readonly">';
                block.data.items.forEach((item, itemIndex) => { // Tambahkan itemIndex
                    // Gunakan input checkbox asli, tapi dengan style read-only
                    html += `
                        <div class="checklist-item-readonly ${item.checked ? 'checked' : ''}">
                            <input type="checkbox" 
                                   class="readonly-checkbox" 
                                   ${item.checked ? 'checked' : ''} 
                                   data-block-index="${blockIndex}" 
                                   data-item-index="${itemIndex}">
                            <label>${item.text}</label>
                        </div>
                    `;
                });
                html += '</div>';
                break;
            default:
                break;
        }
    });
    return html;
},
        // arsip note 

        renderArchivedNotes() {
    // Targetnya sekarang adalah notesList yang sama
    const listContainer = ui.notesList; 
    listContainer.innerHTML = ''; 

    const archivedNotes = state.notes.filter(note => note.isArchived);

    if (archivedNotes.length === 0) {
        listContainer.innerHTML = `<p class="empty-state">Arsip Anda kosong.</p>`;
        return;
    }

    archivedNotes.forEach(note => {
        // ... (seluruh logika pembuatan 'li' dan progress chart tetap sama) ...
    });
},
      
        
        
        
        
    };
    

    // =================================================================
    // 4. EVENT HANDLERS
    // =================================================================

    function setupEventListeners() {

        const mainHeader = document.getElementById('main-list-header');
        if (mainHeader) {
    mainHeader.addEventListener('click', (e) => {
        // Cek tombol mana yang diklik
        const archiveButton = e.target.closest('#archive-view-btn');
        const backButton = e.target.closest('#back-from-archive-btn');

        if (archiveButton) {
            notesService.archiveExpiredNotes();
            state.currentListPage = 'archive'; // Ubah state
            uiManager.renderListPage();       // Render ulang seluruh halaman
        }

        if (backButton) {
            state.currentListPage = 'notes'; // Ubah state
            uiManager.renderListPage();     // Render ulang seluruh halaman
        }
    });
}
        // Di dalam setupEventListeners(), TAMBAHKAN listener baru ini
        const themeToggleButton = document.getElementById('theme-toggle-settings');
        if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
        // Cek tema saat ini dari body class
        const isLightMode = document.body.classList.contains('light-mode');
        // Tentukan tema baru (kebalikannya)
        const newTheme = isLightMode ? 'dark' : 'light';
        // Terapkan tema baru
        uiManager.applyTheme(newTheme);
    });
}

        // --- Global Navigation & Actions ---
        ui.navButtons.forEach(button => {
            if (button.dataset.page) {
                button.addEventListener('click', () => uiManager.navigateToPage(button.dataset.page));
            }
        });
        
        ui.mainAddButton.addEventListener('click', () => uiManager.toggleMenu(true));
        ui.addMenuOverlay.addEventListener('click', () => uiManager.toggleMenu(false));
        ui.addMenuHabitBtn.addEventListener('click', () => {
            uiManager.toggleMenu(false);
            uiManager.openAddHabitView();
        });
        ui.addMenuNoteBtn.addEventListener('click', () => {
            uiManager.toggleMenu(false);
            state.currentNoteId = null;
            ui.noteTitleInput.value = ''; // Kosongkan judul
            ui.noteTitleInput.readOnly = false; // Judul langsung bisa diedit
            uiManager.showView(ui.editorView);
            ui.editNoteButton.classList.add('hidden');
            ui.noteContentEditor.innerHTML = '';
            if (editor) {
              editor.destroy();
            }
            editor = new EditorJS({
              holder: 'note-content-editor',
              tools: {
                checklist: { class: Checklist, inlineToolbar: true },
              },
              data: {}, // Mulai dengan data kosong
              autofocus: true,
            });
            uiManager.renderReminderUI(null);
            
            
            
            
        });
        
        // --- Notes Page ---
        ui.searchInput.addEventListener('input', (e) => uiManager.renderNotes(e.target.value));
        ui.notesList.addEventListener('click', (e) => {
    const noteItem = e.target.closest('li');
    if (!noteItem) return;

    // Cek apakah tombol hapus/arsip yang diklik
    if (e.target.closest('.delete-note-btn')) {
        // Logika hapus/arsip yang sudah ada bisa ditaruh di sini
        // ... (Contoh: panggil fungsi handleNoteAction(noteId))
    } else if (!state.isLongPress) {
        // --- BAGIAN PENTING ---
        // Simpan halaman saat ini SEBELUM membuka editor
        state.pageBeforeEditor = state.currentListPage;
        
        // Buka editor seperti biasa
        const noteId = parseInt(noteItem.dataset.id);
        const note = notesService.getNoteById(noteId);
        uiManager.openNoteEditor(note);
    }
});

        // Long Press to Pin
        ui.notesList.addEventListener('mousedown', handleNotePressStart);
        ui.notesList.addEventListener('mouseup', handleNotePressEnd);
        ui.notesList.addEventListener('mouseleave', handleNotePressEnd);
        ui.notesList.addEventListener('touchstart', handleNotePressStart, { passive: true });
        ui.notesList.addEventListener('touchend', handleNotePressEnd);

        // --- Note Editor ---
        ui.backButton.addEventListener('click', handleSaveNoteAndBack);
        // listener untuk tombol Edit
        ui.editNoteButton.addEventListener('click', () => {
    // Sembunyikan tombol "Edit" itu sendiri
    ui.editNoteButton.classList.add('hidden');
    // Aktifkan input judul
    ui.noteTitleInput.readOnly = false;
    
    // Perbarui UI pengingat agar menjadi interaktif
    const note = notesService.getNoteById(state.currentNoteId);
    uiManager.renderReminderUI(note);

    // Kosongkan area konten sebelum memuat editor
    ui.noteContentEditor.innerHTML = '';
    
    // Buat instance Editor.js
    editor = new EditorJS({
        holder: 'note-content-editor',
        tools: {
            checklist: { class: Checklist, inlineToolbar: true },
        },
        data: note && note.content ? note.content : {},
        autofocus: true,
    });
});
        ui.reminderContainer.addEventListener('click', handleReminderContainerClick);

        // --- Reminder Picker ---
        ui.cancelReminderBtn.addEventListener('click', () => uiManager.toggleReminderPicker(false));
        ui.saveReminderBtn.addEventListener('click', handleSaveReminder);
        ui.openCalendarBtn.addEventListener('click', () => uiManager.switchToPickerView('calendar'));
        ui.pickerPrevMonthBtn.addEventListener('click', () => {
            state.pickerCalendarDate.setMonth(state.pickerCalendarDate.getMonth() - 1);
            uiManager.renderPickerCalendar();
        });
        ui.pickerNextMonthBtn.addEventListener('click', () => {
            state.pickerCalendarDate.setMonth(state.pickerCalendarDate.getMonth() + 1);
            uiManager.renderPickerCalendar();
        });
        ui.pickerCalendarGrid.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.calendar-day');
            if(dayCell) {
                const day = parseInt(dayCell.dataset.day);
                state.tempReminderDate = new Date(state.pickerCalendarDate.getFullYear(), state.pickerCalendarDate.getMonth(), day);
                uiManager.renderPickerCalendar(); // re-render to show selection
            }
        });
        ui.confirmDateBtn.addEventListener('click', () => {
            uiManager.updateReminderDateDisplay();
            uiManager.switchToPickerView('initial');
        });

        // --- Calendar Page ---
        ui.calendarGrid.addEventListener('click', (e) => {
    const dayCell = e.target.closest('.calendar-day');
    if (dayCell && dayCell.dataset.date) {
        const selectedDate = new Date(dayCell.dataset.date);
        uiManager.renderAgenda(selectedDate);
        
        // Tandai tanggal yang dipilih (UI feedback)
        ui.calendarGrid.querySelector('.selected')?.classList.remove('selected');
        dayCell.classList.add('selected');
    }
});
        ui.agendaList.addEventListener('click', (e) => {
             if (e.target.classList.contains('agenda-read-more')) {
                const noteId = parseInt(e.target.dataset.id);
                const note = notesService.getNoteById(noteId);
                if (note) uiManager.openNoteEditor(note);
            }
        });

        // --- Habits Add/Edit Page ---
        ui.backFromAddHabitBtn.addEventListener('click', handleSaveHabit);
        ui.saveHabitBtn.addEventListener('click', handleSaveHabit);
        ui.colorPicker.addEventListener('click', (e) => {
            if(e.target.classList.contains('color-option')) {
                ui.colorPicker.querySelector('.active')?.classList.remove('active');
                e.target.classList.add('active');
            }
        });
        ui.habitTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                ui.quantOptions.classList.toggle('hidden', e.target.value !== 'quantifiable');
            });
        });

        // --- Habits Main Page ---
        ui.addHabitInitialBtn.addEventListener('click', () => uiManager.openAddHabitView());
        ui.habitsGridContainer.addEventListener('click', handleHabitGridClick);
        
        // --- Habit Detail Page ---
        ui.backFromHabitDetailBtn.addEventListener('click', () => uiManager.hideView(ui.habitDetailView));
        ui.editHabitBtn.addEventListener('click', handleEditHabit);
        ui.deleteHabitBtn.addEventListener('click', handleDeleteHabit);
        
        // Letakkan ini di dalam fungsi setupEventListeners()
        ui.monthYearDisplay.addEventListener('click', () => uiManager.toggleDatePicker(true));

        const datePickerModal = document.getElementById('date-picker-modal');
        datePickerModal.addEventListener('click', (e) => {
    if (e.target.id === 'cancel-picker-btn' || e.target.classList.contains('modal-overlay')) {
        uiManager.toggleDatePicker(false);
    } else if (e.target.classList.contains('scroll-item')) {
        const scroller = e.target.parentElement;
        scroller.querySelector('.selected')?.classList.remove('selected');
        e.target.classList.add('selected');
    } else if (e.target.id === 'select-picker-btn') {
        const selectedMonth = parseInt(document.querySelector('#month-scroller .selected').dataset.month);
        const selectedYear = parseInt(document.querySelector('#year-scroller .selected').dataset.year);
        state.calendarDate = new Date(selectedYear, selectedMonth, 1);
        uiManager.renderCalendar();
        uiManager.renderAgenda(new Date(selectedYear, selectedMonth, new Date().getDate()));
        uiManager.toggleDatePicker(false);
    }
})
        // Letakkan ini di dalam fungsi setupEventListeners()
    
        // Listener untuk tombol bulan sebelumnya
        ui.prevMonthBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
        uiManager.renderCalendar();
    });

        // Listener untuk tombol bulan berikutnya
        ui.nextMonthBtn.addEventListener('click', () => {
        state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
        uiManager.renderCalendar();
    });
    // Di dalam setupEventListeners(), TAMBAHKAN listener baru ini
    ui.noteContentEditor.addEventListener('click', (e) => {
    // Cek apakah yang diklik adalah checkbox dalam mode BACA
    if (e.target.classList.contains('readonly-checkbox')) {
        const checkbox = e.target;
        const blockIndex = parseInt(checkbox.dataset.blockIndex);
        const itemIndex = parseInt(checkbox.dataset.itemIndex);
        
        // Dapatkan catatan saat ini dari state
        const note = notesService.getNoteById(state.currentNoteId);
        if (!note || !note.content.blocks) return;

        // Update data JSON langsung di state
        const item = note.content.blocks[blockIndex].data.items[itemIndex];
        item.checked = checkbox.checked;

        // Simpan seluruh data catatan ke localStorage
        storageService.saveData();

        // Render ulang daftar catatan di halaman utama agar progress-nya update
        uiManager.renderNotes();
        
        // Render ulang tampilan read-only di editor agar style-nya (coretan) update
        const parentItem = checkbox.closest('.checklist-item-readonly');
        parentItem.classList.toggle('checked', checkbox.checked);
    }
});
    //tombol arsip

    // Di dalam setupEventListeners(), GANTI listener ini

    // Tombol untuk membuka halaman arsip
      const archiveViewBtn = document.getElementById('archive-view-btn');
      if (archiveViewBtn) {
    archiveViewBtn.addEventListener('click', () => {
        // Sembunyikan semua halaman utama terlebih dahulu
        ui.pages.forEach(page => page.classList.remove('active'));

        // Siapkan data untuk halaman arsip
        uiManager.renderArchivedNotes(); 
        
        // Tampilkan halaman arsip
        const archivePage = document.getElementById('page-archive');
        if (archivePage) {
            archivePage.classList.add('active');
        }
    });
}

    // Tombol untuk kembali dari halaman arsip
    const backFromArchiveBtn = document.getElementById('back-from-archive-btn');
    if (backFromArchiveBtn) {
    backFromArchiveBtn.addEventListener('click', () => {
        // 1. Sembunyikan halaman arsip
        document.getElementById('page-archive').classList.remove('active');

        // 2. Render ulang catatan utama untuk memastikan datanya paling baru
        uiManager.renderNotes();
        
        // 3. Tampilkan kembali halaman catatan utama
        const notesPage = document.getElementById('page-notes');
        if (notesPage) {
            notesPage.classList.add('active');
        }
    });
}

    // Di dalam setupEventListeners(), GANTI listener untuk archiveList

    const archiveList = document.getElementById('archive-list');
    if (archiveViewBtn) {
      archiveViewBtn.addEventListener('click', () => {
        // 1. Sembunyikan halaman catatan utama
        document.getElementById('page-notes').classList.remove('active');
        
        // 2. Siapkan data untuk halaman arsip
        uiManager.renderArchivedNotes(); 
        
        // 3. Tampilkan halaman arsip
        const archivePage = document.getElementById('page-archive');
        if (archivePage) {
            archivePage.classList.add('active');
        }
    });
}

        // --- Pengaturan: Ekspor & Impor Data ---

        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
        // Buat data JSON seperti biasa
        const dataToExport = JSON.stringify({
            notes: state.notes,
            habits: state.habits
        }, null, 2);

        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const today = new Date();
        const dateString = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        
        // --- LOGIKA BARU YANG LEBIH KUAT ---
        // 1. Atur atribut href dan download pada tombol itu sendiri
        exportBtn.href = url;
        exportBtn.download = `pusat_produktivitas_backup_${dateString}.json`;

        // 2. Tidak perlu lagi .click() otomatis. 
        // Klik asli dari pengguna pada elemen <a> ini sudah cukup untuk
        // memulai download.
        
        // Catatan: URL blob hanya berlaku sementara. Kita hapus setelah beberapa saat.
        setTimeout(() => {
            URL.revokeObjectURL(url);
            exportBtn.href = '#'; // Reset href agar tidak bisa diunduh lagi tanpa data baru
        }, 100);
    });
}
        const importBtn = document.getElementById('import-data-btn');
        const importFileInput = document.getElementById('import-file-input');
        if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        storageService.exportData();
    });
}

        if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
        // Picu klik pada input file yang tersembunyi
        importFileInput.click(); 
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        storageService.importData(file);
        // Reset input agar bisa memilih file yang sama lagi
        e.target.value = null; 
    });
}
    
    
    
    }
    
    // --- Handler Functions ---
   
    async function handleSaveNoteAndBack() {
    const title = ui.noteTitleInput.value.trim();
    
    if (editor) {
        try {
            const content = await editor.save();
            notesService.saveNote(title, content);
        } catch (error) {
            console.error('Gagal menyimpan data dari Editor.js:', error);
        }
    }
    
    // --- LOGIKA BARU ---
    // Atur halaman tujuan berdasarkan "memori" yang kita simpan
    state.currentListPage = state.pageBeforeEditor;
    
    // Render ulang halaman yang benar (catatan atau arsip)
    uiManager.renderListPage();
    
    // Tutup editor
    uiManager.closeNoteEditor();

    // Pastikan halaman catatan/arsip yang benar yang ditampilkan
    const notesPage = document.getElementById('page-notes');
    if (notesPage) {
        notesPage.classList.add('active');
    }
}
    
    function handleNotePressStart(e) {
        const listItem = e.target.closest('li');
        if (!listItem) return;
        const noteId = parseInt(listItem.dataset.id);

        state.isLongPress = false;
        clearTimeout(state.longPressTimer);
        state.longPressTimer = setTimeout(() => {
            state.isLongPress = true;
            notesService.togglePin(noteId);
            uiManager.renderNotes(ui.searchInput.value);
        }, 500);
    }

    function handleNotePressEnd() {
        clearTimeout(state.longPressTimer);
    }

    function handleReminderContainerClick(e) {
        const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        if (action === 'add-reminder' || action === 'edit-reminder') {
            uiManager.toggleReminderPicker(true);
        } else if (action === 'remove-reminder') {
            notesService.setReminder(null);
            uiManager.renderReminderUI(state.currentNoteId ? notesService.getNoteById(state.currentNoteId) : null);
            uiManager.renderCalendar();
        }
    }

    function handleSaveReminder() {
        if (!state.tempReminderDate) {
            ui.pickerErrorMsg.textContent = 'Silakan pilih tanggal terlebih dahulu.';
            ui.pickerErrorMsg.style.display = 'block';
            return;
        }
        ui.pickerErrorMsg.style.display = 'none';

        const [hours, minutes] = ui.reminderTimeInput.value.split(':');
        state.tempReminderDate.setHours(hours || 0, minutes || 0, 0, 0);

        notesService.setReminder(state.tempReminderDate);
        
        const currentNote = state.currentNoteId ? notesService.getNoteById(state.currentNoteId) : null;
        uiManager.renderReminderUI(currentNote);
        uiManager.renderCalendar();
        uiManager.toggleReminderPicker(false);
    }

    function handleSaveHabit() {
        const name = ui.addHabitNameInput.value.trim();
        const color = ui.colorPicker.querySelector('.active').dataset.color;
        const type = document.querySelector('input[name="habit-type"]:checked').value;
        const unit = ui.addHabitUnitInput.value.trim();
        const notes = ui.addHabitNotesTextarea.value.trim();

        if (!name) return alert('Nama kebiasaan tidak boleh kosong!');
        if (type === 'quantifiable' && !unit) return alert('Satuan tidak boleh kosong!');
        
        habitsService.saveHabit({
            name,
            color,
            type,
            unit: type === 'quantifiable' ? unit : null,
            notes
        });
        
        uiManager.hideView(ui.addHabitView);
        uiManager.renderHabitsPage();
    }

    function handleHabitGridClick(e) {
        const habitNameCell = e.target.closest('.grid-habit-name');
        const dataCell = e.target.closest('.grid-data-cell.today');

        if (habitNameCell) {
            const habitId = parseInt(habitNameCell.dataset.id);
            const habit = habitsService.getHabitById(habitId);
            if (habit) uiManager.showHabitDetail(habit);
        } else if (dataCell) {
            const habitId = parseInt(dataCell.dataset.id);
            const habit = habitsService.getHabitById(habitId);
            const date = new Date(dataCell.dataset.date);
            const entry = habit.history.find(h => h.date.startsWith(date.toISOString().split('T')[0]));
            
            if (habit.type === 'yesno') {
                const newValue = !entry ? 1 : (entry.value === 1 ? 0 : null);
                habitsService.updateHistory(habit, date, newValue);
            } else if (habit.type === 'quantifiable') {
                const currentValue = entry ? entry.value : 0;
                const newValueStr = prompt(`Masukkan jumlah untuk "${habit.name}" (${habit.unit}):`, currentValue);
                if (newValueStr === null) return;
                const newAmount = parseFloat(newValueStr);
                if (!isNaN(newAmount) && newAmount >= 0) {
                    habitsService.updateHistory(habit, date, newAmount);
                } else {
                    alert("Harap masukkan angka yang valid.");
                }
            }
            uiManager.renderHabitsGrid();
        }
    }
    
    function handleEditHabit() {
        const habitId = parseInt(ui.habitDetailView.dataset.activeHabitId);
        const habit = habitsService.getHabitById(habitId);
        if (habit) {
            uiManager.hideView(ui.habitDetailView);
            uiManager.openAddHabitView(habit);
        }
    }

    function handleDeleteHabit() {
        const habitId = parseInt(ui.habitDetailView.dataset.activeHabitId);
        if (confirm("Anda yakin ingin menghapus kebiasaan ini secara permanen?")) {
            habitsService.deleteHabit(habitId);
            uiManager.hideView(ui.habitDetailView);
            uiManager.renderHabitsPage();
        }
    }


    // =================================================================
    // 5. INITIALIZATION
    // =================================================================

    function init() {
        storageService.loadData();
        notesService.archiveExpiredNotes();
        setupEventListeners();
        
        const savedTheme = localStorage.getItem('theme') || 'dark';
        uiManager.applyTheme(savedTheme);
        
        uiManager.renderListPage();
    
        uiManager.renderCalendar();
        uiManager.renderAgenda(new Date());
        const todayCell = ui.calendarGrid.querySelector('.current-day');
        if (todayCell) {
          todayCell.classList.add('selected');
        }
        uiManager.renderHabitsPage();
        storageService.autoBackup();
        uiManager.navigateToPage('notes');
    }

    // Jalankan aplikasi
    init();

});
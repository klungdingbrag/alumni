/* =====================================================
   STATE
===================================================== */

let TOKEN =
  localStorage.getItem(
    'alumni_token'
  );


let CURRENT_USER =
  JSON.parse(
    localStorage.getItem(
      'alumni_user'
    ) || 'null'
  );


let DIRECTORY_DATA = [];

let ADMIN_ALUMNI_DATA = [];

let CASH_DATA = [];



/* =====================================================
   GOOGLE APPS SCRIPT REST API WRAPPER
===================================================== */

// GANTI dengan URL Web App Google Apps Script Anda.
// Contoh: https://script.google.com/macros/s/XXXXXXXX/exec
const API_URL = 'https://script.google.com/macros/s/AKfycbwzLaXRdv-AQExHzkOCrbeqtq0SqIRTM0vJVl8S8pPFU1qAtxQayetZty3VTG4CL6vq/exec';

const API_ACTION_MAP = {
  loginUser: 'login',
  registerUser: 'register',
  logoutUser: 'logout',
  updateOwnProfile: 'update_profile',
  getDashboard: 'dashboard',
  getProfile: 'profile',
  getDirectory: 'directory',
  getAdminDirectory: 'admin_directory',
  getCashSummary: 'cash_summary',
  getCashTransactions: 'cash_transactions',
  adminCreateAlumni: 'admin_create_alumni',
  adminUpdateAlumni: 'admin_update_alumni',
  adminDeleteAlumni: 'admin_delete_alumni',
  adminBlockAlumni: 'admin_block_alumni',
  adminUnblockAlumni: 'admin_unblock_alumni',
  adminCreateCash: 'admin_create_cash',
  adminUpdateCash: 'admin_update_cash',
  adminDeleteCash: 'admin_delete_cash',
  requestPasswordReset: 'request_password_reset',
  resetPassword: 'reset_password'
};

function server(functionName, ...args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!API_URL || API_URL === 'PASTE_GAS_WEB_APP_URL_HERE') {
        throw new Error('URL Google Apps Script belum dikonfigurasi.');
      }

      const action = API_ACTION_MAP[functionName] || functionName;

      let data = {};

      if (args.length === 1 && args[0] && typeof args[0] === 'object') {
        data = { ...args[0] };
      } else if (args.length === 1) {
        data = { token: args[0] };
      } else if (args.length > 1) {
        data = { args };
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        headers: {
          // text/plain menghindari preflight CORS pada Web App GAS.
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawText = await response.text();
      let result;

      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Respons API bukan JSON:', rawText);
        throw new Error(
          'Respons dari Google Apps Script tidak valid. Pastikan deployment GAS menggunakan versi terbaru dan URL /exec benar.'
        );
      }

      if (!result || result.success === false) {
        throw new Error(
          result?.message || 'Terjadi kesalahan.'
        );
      }

      resolve(result);

    } catch (error) {
      reject(
        new Error(
          error?.message || 'Terjadi kesalahan server.'
        )
      );
    }
  });
}

/* =====================================================
   AUTH UI
===================================================== */

function showLogin() {

  document
    .getElementById(
      'loginBox'
    )
    .classList.remove(
      'hidden'
    );


  document
    .getElementById(
      'registerBox'
    )
    .classList.add(
      'hidden'
    );

  document
    .getElementById(
      'forgotPasswordBox'
    )
    .classList.add(
      'hidden'
    );

}


function showRegister() {

  document
    .getElementById(
      'loginBox'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'registerBox'
    )
    .classList.remove(
      'hidden'
    );

  document
    .getElementById(
      'forgotPasswordBox'
    )
    .classList.add(
      'hidden'
    );

}

/* =====================================================
   FORGOT PASSWORD
===================================================== */

function showForgotPassword() {

  document
    .getElementById(
      'loginBox'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'registerBox'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'forgotPasswordBox'
    )
    .classList.remove(
      'hidden'
    );


  document
    .getElementById(
      'resetRequestStep'
    )
    .classList.remove(
      'hidden'
    );


  document
    .getElementById(
      'resetPasswordStep'
    )
    .classList.add(
      'hidden'
    );

}


document
  .getElementById(
    'forgotPasswordForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const button =
        document
          .getElementById(
            'sendOtpButton'
          );


      const email =
        document
          .getElementById(
            'forgotEmail'
          )
          .value
          .trim();


      button.disabled = true;

      button.textContent =
        'Mengirim...';


      try {

        const result =
          await server(
            'requestPasswordReset',
            {
              email
            }
          );


        showToast(
          result.message,
          'success'
        );


        /*
         * Simpan email untuk step berikutnya.
         */

        document
          .getElementById(
            'resetRequestStep'
          )
          .classList.add(
            'hidden'
          );


        document
          .getElementById(
            'resetPasswordStep'
          )
          .classList.remove(
            'hidden'
          );


      } catch (error) {

        handleError(
          error
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          'Kirim Kode OTP';

      }

    }
  );


  document
  .getElementById(
    'resetPasswordForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const email =
        document
          .getElementById(
            'forgotEmail'
          )
          .value
          .trim();


      const otp =
        document
          .getElementById(
            'resetOtp'
          )
          .value
          .trim();


      const password =
        document
          .getElementById(
            'resetNewPassword'
          )
          .value;


      const confirmPassword =
        document
          .getElementById(
            'resetConfirmPassword'
          )
          .value;


      if (
        password !==
        confirmPassword
      ) {

        showToast(
          'Konfirmasi password tidak sama.',
          'error'
        );

        return;

      }


      if (
        password.length < 8
      ) {

        showToast(
          'Password minimal 8 karakter.',
          'error'
        );

        return;

      }


      const button =
        document
          .getElementById(
            'resetPasswordButton'
          );


      button.disabled =
        true;

      button.textContent =
        'Memproses...';


      try {

        const result =
          await server(
            'resetPassword',
            {

              email,

              otp,

              newPassword:
                password

            }
          );


        showToast(
          result.message,
          'success'
        );


        /*
         * Bersihkan form.
         */

        document
          .getElementById(
            'resetPasswordForm'
          )
          .reset();


        /*
         * Kembali ke login
         * setelah 1 detik.
         */

        setTimeout(
          () => {

            showLogin();

            document
              .getElementById(
                'loginEmail'
              )
              .value =
                email;

          },
          1000
        );


      } catch (error) {

        handleError(
          error
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          'Reset Password';

      }

    }
  );

function backToResetEmail() {

  document
    .getElementById(
      'resetRequestStep'
    )
    .classList.remove(
      'hidden'
    );


  document
    .getElementById(
      'resetPasswordStep'
    )
    .classList.add(
      'hidden'
    );

}

/* =====================================================
   LOGIN
===================================================== */

document
  .getElementById(
    'loginForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const button =
        document
          .getElementById(
            'loginButton'
          );


      button.disabled = true;

      button.textContent =
        'Memproses...';


      try {

        const result =
          await server(
            'loginUser',
            {

              email:
                document
                  .getElementById(
                    'loginEmail'
                  )
                  .value,

              password:
                document
                  .getElementById(
                    'loginPassword'
                  )
                  .value

            }
          );


        TOKEN =
          result.token;


        CURRENT_USER =
          result.user;


        localStorage.setItem(
          'alumni_token',
          TOKEN
        );


        localStorage.setItem(
          'alumni_user',
          JSON.stringify(
            CURRENT_USER
          )
        );


        showToast(
          'Login berhasil.',
          'success'
        );


        showApp();


      } catch (error) {

        showToast(
          error.message,
          'error'
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          'Login';

      }

    }
  );



/* =====================================================
   REGISTER
===================================================== */

document
  .getElementById(
    'registerForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const button =
        document
          .getElementById(
            'registerButton'
          );


      button.disabled = true;

      button.textContent =
        'Mendaftarkan...';


      try {

        await server(
          'registerUser',
          {

            nama:
              document
                .getElementById(
                  'regNama'
                )
                .value,

            email:
              document
                .getElementById(
                  'regEmail'
                )
                .value,

            wa:
              document
                .getElementById(
                  'regWA'
                )
                .value,

            jurusan:
              document
                .getElementById(
                  'regJurusan'
                )
                .value,

            password:
              document
                .getElementById(
                  'regPassword'
                )
                .value

          }
        );


        document
          .getElementById(
            'registerForm'
          )
          .reset();


        showToast(
          'Registrasi berhasil. Silakan login.',
          'success'
        );


        showLogin();


      } catch (error) {

        showToast(
          error.message,
          'error'
        );

      } finally {

        button.disabled =
          false;

        button.textContent =
          'Daftar Alumni';

      }

    }
  );



/* =====================================================
   SHOW APP
===================================================== */

function showApp() {

  document
    .getElementById(
      'authScreen'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'app'
    )
    .classList.remove(
      'hidden'
    );


  renderUser();


  navigate(
    'dashboard'
  );

}



/* =====================================================
   USER
===================================================== */

function renderUser() {

  if (!CURRENT_USER) {
    return;
  }


  document
    .getElementById(
      'userMini'
    )
    .innerHTML = `

      <div class="font-bold">

        ${escapeHtml(
          CURRENT_USER.nama
        )}

      </div>

      <div class="text-xs
                  text-slate-300
                  mt-1
                  break-all">

        ${escapeHtml(
          CURRENT_USER.email
        )}

      </div>

      <div class="mt-3">

        <span class="
          inline-block
          rounded-full
          bg-gold
          text-navy
          px-2 py-1
          text-[10px]
          font-black">

          ${escapeHtml(
            CURRENT_USER.role
          )}

        </span>

      </div>

    `;


  if (
    CURRENT_USER.role ===
    'Admin'
  ) {

    document
      .getElementById(
        'adminNavigation'
      )
      .classList.remove(
        'hidden'
      );

  } else {

    document
      .getElementById(
        'adminNavigation'
      )
      .classList.add(
        'hidden'
      );

  }

}



/* =====================================================
   NAVIGATION
===================================================== */

function navigate(
  page
) {

  document
    .querySelectorAll(
      '.page'
    )
    .forEach(
      section => {

        section.classList.add(
          'hidden'
        );

      }
    );


  const target =
    document.getElementById(
      'page-' + page
    );


  if (!target) {
    return;
  }


  target.classList.remove(
    'hidden'
  );


  switch (page) {

    case 'dashboard':

      loadDashboard();

      break;


    case 'profile':

      loadProfile();

      break;


    case 'directory':

      loadDirectory();

      break;


    case 'cash':

      loadCash();

      break;


    case 'adminAlumni':

      if (
        CURRENT_USER.role !==
        'Admin'
      ) {

        showToast(
          'Akses ditolak.',
          'error'
        );

        navigate(
          'dashboard'
        );

        return;

      }

      loadAdminAlumni();

      break;


    case 'adminCash':

      if (
        CURRENT_USER.role !==
        'Admin'
      ) {

        showToast(
          'Akses ditolak.',
          'error'
        );

        navigate(
          'dashboard'
        );

        return;

      }

      loadAdminCash();

      break;

  }


  closeSidebar();

}



/* =====================================================
   SIDEBAR
===================================================== */

function toggleSidebar() {

  document
    .getElementById(
      'sidebar'
    )
    .classList.toggle(
      '-translate-x-full'
    );

}


function closeSidebar() {

  document
    .getElementById(
      'sidebar'
    )
    .classList.add(
      '-translate-x-full'
    );

}

/* =====================================================
   DASHBOARD
===================================================== */

async function loadDashboard() {

  try {

    const result =
      await server(
        'getDashboard',
        TOKEN
      );


    const stats =
      result.statistics;


    document
      .getElementById(
        'dashboardName'
      )
      .textContent =
        result.user.nama ||
        CURRENT_USER.nama;


    document
      .getElementById(
        'statTotal'
      )
      .textContent =
        stats.totalAlumni;


    document
      .getElementById(
        'statSailing'
      )
      .textContent =
        stats.activeSailing;


    document
      .getElementById(
        'statNautika'
      )
      .textContent =
        stats.nautika;


    document
      .getElementById(
        'statTeknika'
      )
      .textContent =
        stats.teknika;

    document
      .getElementById(
        'statSaldo'
      )
      .textContent =
        formatRupiah(
          stats.saldo
        );


    document
      .getElementById(
        'statStatus'
      )
      .textContent =
        result.user.status_layar ||
        'Belum diisi';


    document
      .getElementById(
        'statKapal'
      )
      .textContent =
        result.user.nama_kapal ||
        'Kapal / perusahaan belum diisi';


    CURRENT_USER =
      result.user;

    localStorage.setItem(
      'alumni_user',
      JSON.stringify(
        CURRENT_USER
      )
    );


  } catch (error) {

    handleError(
      error
    );

  }

}



/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

  try {

    const result =
      await server(
        'getProfile',
        TOKEN
      );


    CURRENT_USER =
      result.user;

    localStorage.setItem(
      'alumni_user',
      JSON.stringify(
        CURRENT_USER
      )
    );


    fillProfile();

    renderUser();


  } catch (error) {

    handleError(
      error
    );

  }

}


function fillProfile() {

  const user =
    CURRENT_USER;


  document
    .getElementById(
      'profileNama'
    )
    .value =
      user.nama || '';


  document
    .getElementById(
      'profileEmail'
    )
    .value =
      user.email || '';


  document
    .getElementById(
      'profileWA'
    )
    .value =
      user.wa || '';


  document
    .getElementById(
      'profileJurusan'
    )
    .value =
      user.jurusan ||
      'Nautika';


  document
    .getElementById(
      'profileAngkatan'
    )
    .value =
      user.angkatan || '';


  document
    .getElementById(
      'profileIjazah'
    )
    .value =
      user.tingkat_ijazah ||
      '';


  document
    .getElementById(
      'profileStatus'
    )
    .value =
      user.status_layar ||
      'On Land';


  document
    .getElementById(
      'profileKapal'
    )
    .value =
      user.nama_kapal ||
      '';


  document
    .getElementById(
      'profileSertifikat'
    )
    .value =
      user.sertifikat ||
      '';

}


document
  .getElementById(
    'profileForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      try {
        const result =
          await server(
            'updateOwnProfile',
            {

              token:
                TOKEN,

              nama:
                document
                  .getElementById(
                    'profileNama'
                  )
                  .value,

              wa:
                document
                  .getElementById(
                    'profileWA'
                  )
                  .value,
              jurusan:
                document
                  .getElementById(
                    'profileJurusan'
                  )
                  .value,

              angkatan:
                document
                  .getElementById(
                    'profileAngkatan'
                  )
                  .value,

              tingkat_ijazah:
                document
                  .getElementById(
                    'profileIjazah'
                  )
                  .value,

              status_layar:
                document
                  .getElementById(
                    'profileStatus'
                  )
                  .value,

              nama_kapal:
                document
                  .getElementById(
                    'profileKapal'
                  )
                  .value,

              sertifikat:
                document
                  .getElementById(
                    'profileSertifikat'
                  )
                  .value

            }
          );

        CURRENT_USER =
          result.user;

        localStorage.setItem(
          'alumni_user',
          JSON.stringify(
            CURRENT_USER
          )
        );

        renderUser();

        showToast(
          result.message,
          'success'
        );

      } catch (error) {

        handleError(
          error
        );

      }

    }
  );


/* =====================================================
   DIRECTORY
===================================================== */

async function loadDirectory() {

  try {

    const result =
      await server(
        'getDirectory',
        TOKEN
      );


    DIRECTORY_DATA =
      result.data || [];


    filterDirectory();


  } catch (error) {

    handleError(
      error
    );

  }

}


function filterDirectory() {

  const search =
    document
      .getElementById(
        'directorySearch'
      )
      .value
      .toLowerCase()
      .trim();


  const jurusan =
    document
      .getElementById(
        'directoryJurusan'
      )
      .value;


  const angkatan =
    document
      .getElementById(
        'directoryAngkatan'
      )
      .value
      .toLowerCase()
      .trim();


  const status =
    document
      .getElementById(
        'directoryStatus'
      )
      .value;


  const filtered =
    DIRECTORY_DATA.filter(
      item => {

        const matchesSearch =
          !search ||
          String(
            item.nama || ''
          )
            .toLowerCase()
            .includes(
              search
            );

        const matchesJurusan =
          !jurusan ||
          item.jurusan ===
            jurusan;

        const matchesAngkatan =
          !angkatan ||
          String(
            item.angkatan || ''
          )
            .toLowerCase()
            .includes(
              angkatan
            );

        const matchesStatus =
          !status ||
          item.status_layar ===
            status;

        return (
          matchesSearch &&
          matchesJurusan &&
          matchesAngkatan &&
          matchesStatus
        );

      }
    );


  renderDirectory(
    filtered
  );

}


function renderDirectory(
  data
) {

  const tbody =
    document
      .getElementById(
        'directoryTableBody'
      );


  const cards =
    document
      .getElementById(
        'directoryCards'
      );


  tbody.innerHTML = '';
  cards.innerHTML = '';


  data.forEach(
    item => {

      tbody.innerHTML += `

        <tr class="border-b">

          <td class="py-3 font-semibold">
            ${escapeHtml(item.nama)}
          </td>

          <td class="py-3">
            ${escapeHtml(item.jurusan)}
          </td>

          <td class="py-3">
            ${escapeHtml(item.angkatan || '-')}
          </td>

          <td class="py-3">
            ${escapeHtml(item.status_layar || '-')}
          </td>

          <td class="py-3">
            ${escapeHtml(item.nama_kapal || '-')}
          </td>

        </tr>

      `;

      cards.innerHTML += `

        <div class="bg-white rounded-2xl p-5 shadow-sm">

          <div class="font-black text-navy">
            ${escapeHtml(item.nama)}
          </div>

          <div class="text-sm text-slate-500 mt-1">
            ${escapeHtml(item.jurusan)} · ${escapeHtml(item.angkatan || '-')}
          </div>

          <div class="mt-3 text-sm">
            <div><b>Status:</b> ${escapeHtml(item.status_layar || '-')}</div>
            <div><b>Kapal:</b> ${escapeHtml(item.nama_kapal || '-')}</div>
          </div>

        </div>

      `;

    }
  );


  document
    .getElementById(
      'directoryCount'
    )
    .textContent =
      data.length;

}


/* =====================================================
   CASH
===================================================== */

async function loadCash() {

  try {

    const summary =
      await server(
        'getCashSummary',
        TOKEN
      );


    document
      .getElementById(
        'cashSaldo'
      )
      .textContent =
        formatRupiah(
          summary.saldo
        );


    document
      .getElementById(
        'cashPemasukan'
      )
      .textContent =
        formatRupiah(
          summary.pemasukan
        );


    document
      .getElementById(
        'cashPengeluaran'
      )
      .textContent =
        formatRupiah(
          summary.pengeluaran
        );


    const result =
      await server(
        'getCashTransactions',
        TOKEN
      );


    CASH_DATA =
      result.data || [];


    renderCash(
      CASH_DATA
    );


  } catch (error) {

    handleError(
      error
    );

  }

}


function renderCash(
  data
) {

  const tbody =
    document
      .getElementById(
        'cashTableBody'
      );


  tbody.innerHTML = '';


  data.forEach(
    tx => {

      tbody.innerHTML += `

        <tr class="border-b">

          <td class="py-3">
            ${escapeHtml(tx.tanggal)}
          </td>

          <td class="py-3">
            <span class="rounded-full px-3 py-1 text-xs font-bold
              ${tx.tipe === 'Pemasukan'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'}">
              ${escapeHtml(tx.tipe)}
            </span>
          </td>

          <td class="py-3 font-semibold">
            ${formatRupiah(tx.nominal)}
          </td>

          <td class="py-3">
            ${escapeHtml(tx.keterangan)}
          </td>

        </tr>

      `;

    }
  );

}


/* =====================================================
   ADMIN ALUMNI
===================================================== */

async function loadAdminAlumni() {

  try {

    const result =
      await server(
        'getAdminDirectory',
        TOKEN
      );


    ADMIN_ALUMNI_DATA =
      result.data || [];


    renderAdminAlumni(
      ADMIN_ALUMNI_DATA
    );


  } catch (error) {

    handleError(
      error
    );

  }

}


function renderAdminAlumni(
  data
) {

  const tbody =
    document
      .getElementById(
        'adminAlumniTableBody'
      );


  tbody.innerHTML = '';


  data.forEach(
    item => {

      tbody.innerHTML += `

        <tr class="border-b">

          <td class="py-3 font-semibold">
            ${escapeHtml(item.nama)}
          </td>

          <td class="py-3">
            ${escapeHtml(item.email)}
          </td>

          <td class="py-3">
            ${escapeHtml(item.jurusan)}
          </td>

          <td class="py-3">
            ${escapeHtml(item.angkatan || '-')}
          </td>

          <td class="py-3">
            ${escapeHtml(item.status)}
          </td>

          <td class="py-3">
            <div class="flex flex-wrap gap-2">

              <button
                onclick="editAlumni('${escapeJs(item.id)}')"
                class="text-xs px-3 py-2 rounded-lg bg-slate-100">
                Edit
              </button>

              ${item.status === 'Blocked'
                ? `<button onclick="unblockAlumni('${escapeJs(item.id)}')" class="text-xs px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700">Aktifkan</button>`
                : `<button onclick="blockAlumni('${escapeJs(item.id)}')" class="text-xs px-3 py-2 rounded-lg bg-amber-100 text-amber-700">Blokir</button>`}

              ${item.role !== 'Admin'
                ? `<button onclick="deleteAlumni('${escapeJs(item.id)}')" class="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700">Hapus</button>`
                : ''}

            </div>
          </td>

        </tr>

      `;

    }
  );

}


function openAlumniModal(id = '') {

  const modal =
    document
      .getElementById(
        'alumniModal'
      );

  document
    .getElementById(
      'alumniId'
    )
    .value = id;

  document
    .getElementById(
      'alumniForm'
    )
    .reset();

  if (id) {
    const item =
      ADMIN_ALUMNI_DATA.find(
        x => x.id === id
      );

    if (item) {
      document.getElementById('alumniNama').value = item.nama || '';
      document.getElementById('alumniEmail').value = item.email || '';
      document.getElementById('alumniWA').value = item.wa || '';
      document.getElementById('alumniJurusan').value = item.jurusan || 'Nautika';
      document.getElementById('alumniAngkatan').value = item.angkatan || '';
      document.getElementById('alumniIjazah').value = item.tingkat_ijazah || '';
      document.getElementById('alumniStatusLayar').value = item.status_layar || 'On Land';
      document.getElementById('alumniKapal').value = item.nama_kapal || '';
      document.getElementById('alumniSertifikat').value = item.sertifikat || '';
      document.getElementById('alumniRole').value = item.role || 'Alumni';
      document.getElementById('alumniStatus').value = item.status || 'Aktif';
    }
  } else {
    document.getElementById('alumniRole').value = 'Alumni';
    document.getElementById('alumniStatus').value = 'Aktif';
  }

  document
    .getElementById(
      'alumniModalTitle'
    )
    .textContent = id
      ? 'Edit Alumni'
      : 'Tambah Alumni';

  document
    .getElementById(
      'passwordHelp'
    )
    .textContent = id
      ? '(isi hanya jika ingin mengganti password)'
      : '(wajib untuk alumni baru)';

  modal.classList.remove('hidden');
  modal.classList.add('flex');

}


function closeAlumniModal() {
  const modal = document.getElementById('alumniModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}


function editAlumni(id) {
  openAlumniModal(id);
}


document
  .getElementById(
    'alumniForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      const id = document.getElementById('alumniId').value;
      const password = document.getElementById('alumniPassword').value;
      const payload = {
        token: TOKEN,
        id,
        nama: document.getElementById('alumniNama').value,
        email: document.getElementById('alumniEmail').value,
        wa: document.getElementById('alumniWA').value,
        jurusan: document.getElementById('alumniJurusan').value,
        angkatan: document.getElementById('alumniAngkatan').value,
        tingkat_ijazah: document.getElementById('alumniIjazah').value,
        status_layar: document.getElementById('alumniStatusLayar').value,
        nama_kapal: document.getElementById('alumniKapal').value,
        sertifikat: document.getElementById('alumniSertifikat').value,
        role: document.getElementById('alumniRole').value,
        status: document.getElementById('alumniStatus').value
      };

      if (password) {
        payload.password = password;
      }

      try {
        const result = await server(
          id ? 'adminUpdateAlumni' : 'adminCreateAlumni',
          payload
        );

        closeAlumniModal();
        await loadAdminAlumni();
        showToast(result.message, 'success');

      } catch (error) {
        handleError(error);
      }

    }
  );


async function blockAlumni(id) {

  if (!confirm('Blokir alumni ini?')) {
    return;
  }

  try {
    const result = await server(
      'adminBlockAlumni',
      {
        token: TOKEN,
        id
      }
    );

    await loadAdminAlumni();
    showToast(result.message, 'success');

  } catch (error) {
    handleError(error);
  }

}


async function unblockAlumni(id) {

  try {
    const result = await server(
      'adminUnblockAlumni',
      {
        token: TOKEN,
        id
      }
    );

    await loadAdminAlumni();
    showToast(result.message, 'success');

  } catch (error) {
    handleError(error);
  }

}


async function deleteAlumni(id) {

  if (!confirm('Hapus data alumni ini secara permanen?')) {
    return;
  }

  try {
    const result = await server(
      'adminDeleteAlumni',
      {
        token: TOKEN,
        id
      }
    );

    await loadAdminAlumni();
    showToast(result.message, 'success');

  } catch (error) {
    handleError(error);
  }

}


/* =====================================================
   ADMIN CASH
===================================================== */

async function loadAdminCash() {

  try {

    const summary =
      await server(
        'getCashSummary',
        TOKEN
      );


    document
      .getElementById(
        'adminCashSaldo'
      )
      .textContent =
        formatRupiah(
          summary.saldo
        );


    const result =
      await server(
        'getCashTransactions',
        TOKEN
      );


    CASH_DATA =
      result.data || [];


    renderAdminCash(
      CASH_DATA
    );


  } catch (error) {

    handleError(
      error
    );

  }

}


function renderAdminCash(
  data
) {

  const tbody =
    document
      .getElementById(
        'adminCashTableBody'
      );


  tbody.innerHTML = '';


  data.forEach(
    tx => {

      tbody.innerHTML += `

        <tr class="border-b">

          <td class="py-3">
            ${escapeHtml(tx.tanggal)}
          </td>

          <td class="py-3">
            ${escapeHtml(tx.tipe)}
          </td>

          <td class="py-3 font-semibold">
            ${formatRupiah(tx.nominal)}
          </td>

          <td class="py-3">
            ${escapeHtml(tx.keterangan)}
          </td>

          <td class="py-3">
            <div class="flex flex-wrap gap-2">

              <button
                onclick="editCash('${escapeJs(tx.id)}')"
                class="text-xs px-3 py-2 rounded-lg bg-slate-100">
                Edit
              </button>

              <button
                onclick="deleteCash('${escapeJs(tx.id)}')"
                class="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-700">
                Hapus
              </button>

            </div>
          </td>

        </tr>

      `;

    }
  );

}


function openCashModal(id = '') {

  const modal =
    document.getElementById('cashModal');

  document.getElementById('cashId').value = id;
  document.getElementById('cashForm').reset();
  document.getElementById('cashTanggal').value = todayLocal();

  if (id) {
    const item = CASH_DATA.find(x => x.id === id);
    if (item) {
      document.getElementById('cashTanggal').value = convertDateToInput(item.tanggal);
      document.getElementById('cashTipe').value = item.tipe || 'Pemasukan';
      document.getElementById('cashNominal').value = item.nominal || '';
      document.getElementById('cashKeterangan').value = item.keterangan || '';
    }
  }

  document.getElementById('cashModalTitle').textContent = id
    ? 'Edit Transaksi'
    : 'Tambah Transaksi';

  modal.classList.remove('hidden');
  modal.classList.add('flex');

}


function closeCashModal() {
  const modal = document.getElementById('cashModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}


function editCash(id) {
  openCashModal(id);
}


document
  .getElementById(
    'cashForm'
  )
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      const id = document.getElementById('cashId').value;
      const payload = {
        token: TOKEN,
        tanggal: document.getElementById('cashTanggal').value,
        tipe: document.getElementById('cashTipe').value,
        nominal: document.getElementById('cashNominal').value,
        keterangan: document.getElementById('cashKeterangan').value
      };

      if (id) {
        payload.id = id;
      }

      try {
        const result = await server(
          id ? 'adminUpdateCash' : 'adminCreateCash',
          payload
        );

        closeCashModal();
        await loadAdminCash();
        showToast(result.message, 'success');

      } catch (error) {
        handleError(error);
      }

    }
  );


async function deleteCash(id) {

  if (!confirm('Hapus transaksi ini?')) {
    return;
  }

  try {
    const result = await server(
      'adminDeleteCash',
      {
        token: TOKEN,
        id
      }
    );

    await loadAdminCash();
    showToast(result.message, 'success');

  } catch (error) {
    handleError(error);
  }

}


/* =====================================================
   EXPORT CSV
===================================================== */
function exportCashCSV() {

  let csv =
    'Tanggal,Tipe,Nominal,Keterangan,CreatedBy\n';

  CASH_DATA.forEach(
    tx => {

      csv +=
        [

          csvEscape(
            tx.tanggal
          ),

          csvEscape(
            tx.tipe
          ),

          tx.nominal,

          csvEscape(
            tx.keterangan
          ),

          csvEscape(
            tx.createdBy
          )

        ].join(',') +
        '\n';

    }
  );


  const blob =
    new Blob(
      [csv],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      'a'
    );

  link.href =
    url;

  link.download =
    'laporan-kas-alumni.csv';


  document.body.appendChild(
    link
  );


  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );


  showToast(
    'Laporan CSV berhasil dibuat.',
    'success'
  );

}



/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

  try {

    await server(
      'logoutUser',
      {
        token: TOKEN
      }
    );

  } catch (error) {
    console.warn(
      error
    );
  }


  TOKEN = null;
  CURRENT_USER = null;

  localStorage.removeItem(
    'alumni_token'
  );

  localStorage.removeItem(
    'alumni_user'
  );

  location.reload();

}



/* =====================================================
   ERROR HANDLER
===================================================== */

function handleError(
  error
) {

  console.error(
    error
  );


  const message =
    error.message ||
    'Terjadi kesalahan.';

  if (
    message
      .toLowerCase()
      .includes(
        'session'
      )
  ) {

    TOKEN = null;
    CURRENT_USER = null;

    localStorage.removeItem(
      'alumni_token'
    );

    localStorage.removeItem(
      'alumni_user'
    );

    showToast(
      'Session berakhir. Silakan login kembali.',
      'error'
    );

    setTimeout(
      () => location.reload(),
      1200
    );

    return;

  }


  showToast(
    message,
    'error'
  );

}
/* =====================================================
   TOAST
===================================================== */

function showToast(
  message,
  type = 'success'
) {

  const toast =
    document
      .getElementById(
        'toast'
      );

  toast.textContent =
    message;

  toast.className = `

    fixed
    right-5
    bottom-5
    z-[200]
    max-w-sm
    rounded-2xl
    px-5
    py-4
    text-white
    shadow-2xl
    ${
      type === 'success'
      ? 'bg-emerald-600'
      : 'bg-red-600'
    }

  `;

  setTimeout(
    () => {
      toast.classList.add(
        'hidden'
      );
    },
    3500
  );

}



/* =====================================================
   FORMAT
===================================================== */

function formatRupiah(
  value
) {

  return new Intl.NumberFormat(
    'id-ID',
    {

      style:
        'currency',

      currency:
        'IDR',
      maximumFractionDigits:
        0

    }
  ).format(
    Number(value) || 0
  );

}


function todayLocal() {

  const date =
    new Date();


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    )
    .padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    )
    .padStart(
      2,
      '0'
    );

  return (
    year +
    '-' +
    month +
    '-' +
    day
  );

}


function convertDateToInput(
  value
) {
  if (!value) {
    return todayLocal();
  }

  const parts =
    String(
      value
    ).split('/');

  if (
    parts.length === 3
  ) {

    return (

      parts[2] +
      '-' +
      parts[1].padStart(2, '0') +
      '-' +
      parts[0].padStart(2, '0')

    );

  }

  return String(
    value
  ).substring(
    0,
    10
  );

}



/* =====================================================
   SECURITY / ESCAPE
===================================================== */
function escapeHtml(
  value
) {

  return String(
    value ?? ''
  )

    .replaceAll(
      '&',
      '&amp;'
    )

    .replaceAll(
      '<',
      '&lt;'
    )

    .replaceAll(
      '>',
      '&gt;'
    )

    .replaceAll(
      '"',
      '&quot;'
    )

    .replaceAll(
      "'",
      '&#039;'
    );

}


function escapeJs(
  value
) {

  return String(
    value ?? ''
  )

    .replaceAll(
      '\\',
      '\\\\'
    )

    .replaceAll(
      "'",
      "\\'"
    );

}

function csvEscape(
  value
) {

  return '"' +

    String(
      value ?? ''
    )
      .replaceAll(
        '"',
        '""'
      ) +

    '"';

}



/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    if (
      TOKEN &&
      CURRENT_USER
    ) {

      showApp();

    }
  }
);

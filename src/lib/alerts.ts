import Swal, { SweetAlertIcon } from 'sweetalert2';

// Wood & Gold Fantasy RPG Theme Base Configuration for SweetAlert2
const RpgSwal = Swal.mixin({
  background: '#381403',
  color: '#FEF3C7',
  customClass: {
    popup: 'rpg-dialog-box rounded-3xl p-5 shadow-2xl border-4 border-[#1a0802]',
    title: 'text-xl font-black tracking-wide rpg-text-gold',
    htmlContainer: 'text-sm font-semibold text-amber-100',
    confirmButton:
      'wood-btn-gold px-6 py-2.5 rounded-2xl font-black text-sm mx-1.5 cursor-pointer shadow-lg',
    cancelButton:
      'wood-btn-brown px-5 py-2.5 rounded-2xl font-black text-sm mx-1.5 cursor-pointer shadow-lg',
  },
  buttonsStyling: false,
});

// 1. Toast Notification (Auto close in 2.5s, non-blocking)
export const showToast = (title: string, icon: SweetAlertIcon = 'success') => {
  if (typeof window === 'undefined') return;
  return RpgSwal.fire({
    toast: true,
    position: 'top',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    icon,
    title,
    background: '#351203',
  });
};

// 2. Alert Modal (Popup with OK button)
export const showAlert = async (
  title: string,
  text?: string,
  icon: SweetAlertIcon = 'info'
) => {
  if (typeof window === 'undefined') return;
  return RpgSwal.fire({
    icon,
    title,
    text,
    confirmButtonText: 'ตกลง',
  });
};

// 3. Confirm Dialog (Popup with Confirm and Cancel)
export const showConfirm = async (
  title: string,
  text?: string,
  confirmButtonText: string = 'ยืนยัน',
  cancelButtonText: string = 'ยกเลิก',
  icon: SweetAlertIcon = 'warning'
): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const result = await RpgSwal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });
  return result.isConfirmed;
};

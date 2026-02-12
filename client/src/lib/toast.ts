import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => toast.success(message, {
        style: {
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0'
        },
        iconTheme: {
            primary: '#059669',
            secondary: '#ecfdf5',
        },
    }),
    error: (message: string) => toast.error(message, {
        style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca'
        },
        iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
        },
    }),
    loading: (message: string) => toast.loading(message),
    dismiss: (toastId?: string) => toast.dismiss(toastId),
};

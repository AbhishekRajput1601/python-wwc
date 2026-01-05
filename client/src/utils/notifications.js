import { toast } from 'react-toastify';

const DEFAULT_OPTIONS = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

const notify = {
  success: (message, opts = {}) => toast.success(message, { ...DEFAULT_OPTIONS, ...opts }),
  error: (message, opts = {}) => toast.error(message, { ...DEFAULT_OPTIONS, ...opts }),
  info: (message, opts = {}) => toast.info(message, { ...DEFAULT_OPTIONS, ...opts }),
  warn: (message, opts = {}) => toast.warn(message, { ...DEFAULT_OPTIONS, ...opts }),
};

export default notify;

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Grow from '@mui/material/Grow';
import { useNotification } from '../context/NotificationContext';

function GrowTransition(props) {
  return <Grow {...props} />;
}

export default function Notification() {
  const { notifications, closeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  const notification = notifications[0];

  return (
    <Snackbar
      open={true}
      autoHideDuration={4000}
      onClose={() => closeNotification(notification.id)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={GrowTransition}
      key={notification.id}
    >
      <Alert
        onClose={() => closeNotification(notification.id)}
        severity={notification.severity}
        sx={{ 
          width: '100%',
          boxShadow: 3,
          animation: 'slideDown 0.4s ease-out',
          '@keyframes slideDown': {
            from: {
              opacity: 0,
              transform: 'translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
}

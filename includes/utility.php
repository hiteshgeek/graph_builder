<?php
/**
 * Utility helper class for standalone Graph Builder access
 * Only used when framework's Utility class is not available
 */

if (!class_exists('Utility')) {
    class Utility
    {
        /**
         * Send a successful JSON response and exit
         *
         * @param string $message Success message
         * @param mixed $data Optional data to include
         */
        public static function ajaxResponseTrue($message = '', $data = null)
        {
            header('Content-Type: application/json');
            echo json_encode(array(
                'success' => true,
                'data' => $data,
                'screen_message' => array(
                    array('type' => 'success', 'message' => $message)
                ),
                'custom_data' => null
            ));
            exit;
        }

        /**
         * Send a failure JSON response and exit
         *
         * @param string $message Error message
         * @param mixed $data Optional data to include
         */
        public static function ajaxResponseFalse($message = '', $data = null)
        {
            header('Content-Type: application/json');
            echo json_encode(array(
                'success' => false,
                'data' => $data,
                'screen_message' => array(
                    array('type' => 'error', 'message' => $message)
                ),
                'custom_data' => null
            ));
            exit;
        }
    }
}

// Stub classes for ScreenMessage and System if not available
if (!class_exists('ScreenMessage')) {
    class ScreenMessage
    {
        const MESSAGE_TYPE_INFO = 'info';
        const MESSAGE_TYPE_SUCCESS = 'success';
        const MESSAGE_TYPE_ERROR = 'error';
        const MESSAGE_TYPE_WARNING = 'warning';

        public static function setMessage($message, $type = 'info')
        {
            // In standalone mode, just store in session if available
            if (session_status() === PHP_SESSION_ACTIVE) {
                $_SESSION['screen_message'] = array('message' => $message, 'type' => $type);
            }
        }
    }
}

if (!class_exists('System')) {
    class System
    {
        public static function redirectInternal($path)
        {
            // In standalone mode, just redirect to error page or home
            header('HTTP/1.1 403 Forbidden');
            echo '<!DOCTYPE html><html><head><title>403 Forbidden</title></head><body><h1>403 Forbidden</h1><p>The requested URL is not valid.</p></body></html>';
            exit;
        }
    }
}

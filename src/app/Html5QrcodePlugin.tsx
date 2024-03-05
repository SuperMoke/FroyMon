import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Html5QrcodePluginProps {
    fps?: number;
    qrbox?: number;
    aspectRatio?: number;
    disableFlip?: boolean;
    verbose?: boolean;
    qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void;
    qrCodeErrorCallback?: (errorMessage: string) => void;
}

const qrcodeRegionId = "html5qr-code-full-region";

const createConfig = (props: Html5QrcodePluginProps) => {
    let config: any = {};
    if (props.fps) {
        config.fps = props.fps;
    }
    if (props.qrbox) {
        config.qrbox = props.qrbox;
    }
    if (props.aspectRatio) {
        config.aspectRatio = props.aspectRatio;
    }
    if (props.disableFlip !== undefined) {
        config.disableFlip = props.disableFlip;
    }
    return config;
};

const Html5QrcodePlugin = (props: Html5QrcodePluginProps) => {

    useEffect(() => {
        const config = createConfig(props);
        const verbose = props.verbose === true;
        if (!props.qrCodeSuccessCallback) {
            throw new Error("qrCodeSuccessCallback is required callback.");
        }
        const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, verbose);
        html5QrcodeScanner.render(props.qrCodeSuccessCallback, props.qrCodeErrorCallback);

        return () => {
            html5QrcodeScanner.clear().catch((error: any) => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, []);

    return (
        <div id={qrcodeRegionId} style={{ color: 'black' }}>
            <style>
                {`
                    .html5-qrcode-scanner-video, .html5-qrcode-laser {
                        filter: invert(0) hue-rotate(180deg);
                    }
                    .html5-qrcode-region-fill {
                        background: none;
                        border: 2px solid black;
                    }
                `}
            </style>
        </div>
    );
};

export default Html5QrcodePlugin;

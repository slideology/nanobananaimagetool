import { forwardRef, useImperativeHandle, useRef } from "react";
import { GoogleOAuth } from "~/features/oauth";
import { Gift, X } from "lucide-react";

export interface AuthPromptModalRef {
    open: () => void;
    close: () => void;
}

export const AuthPromptModal = forwardRef<AuthPromptModalRef>((_, ref) => {
    const modalRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
        open: () => modalRef.current?.showModal(),
        close: () => modalRef.current?.close(),
    }));

    return (
        <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
            <div className="modal-box sm:max-w-md relative">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => modalRef.current?.close()}
                >
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center pt-4">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                        <Gift className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        Welcome to Nano Banana!
                    </h2>
                    <p className="text-center text-gray-600 mb-8">
                        Sign in now to get <span className="font-bold text-primary">30 Free Credits</span> and start creating amazing AI art immediately.
                    </p>
                    <GoogleOAuth
                        useOneTap={false}
                        onSuccess={() => modalRef.current?.close()}
                    />
                    <p className="text-xs text-gray-400 mt-6 text-center">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    );
});

AuthPromptModal.displayName = "AuthPromptModal";

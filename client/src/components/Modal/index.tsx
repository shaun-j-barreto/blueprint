import React from "react";
import ReactDOM from "react-dom";
import Header from "../Header";
import { X } from "lucide-react";

type Props = {
    children: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    name: string;
};

const Modal = ({ children, isOpen, onClose, name }: Props) => {
    if (!isOpen) return null;
    return ReactDOM.createPortal(
        <div className="indset-0 bg-brand-700/50 fixed flex h-full w-full items-center justify-center overflow-y-auto p-4">
            <div className="bg-brand-200 w-full max-w-2xl rounded-lg p-4 shadow-lg">
                <Header
                    name={name}
                    buttonComponent={
                        <button
                            className="bg-brand-500 text-brand-900 hover:bg-brand-600 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    }
                    isSmallText
                />
                {children}
            </div>
        </div>,
        document.body,
    );
};

export default Modal;

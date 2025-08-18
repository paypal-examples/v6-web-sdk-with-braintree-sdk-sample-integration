import React, { useState, useCallback } from "react";
import PayPalButton from "../components/PayPalButton";
import ProductDisplay from "../components/ProductDisplay";
import PaymentModal from "../components/PaymentModal";

import soccerBallImage from "../static/images/world-cup.jpg";
import "../static/styles/SoccerBall.css";
import "../static/styles/Modal.css";

// Types
export type ModalType = "success" | "cancel" | "error" | null;

interface ModalContent {
  title: string;
  message: string;
}

// Constants
const PRODUCT = {
  name: "World Cup Ball",
  icon: "⚽️",
  price: 100.0,
  imageSrc: soccerBallImage,
  imageAlt: "Official World Cup Soccer Ball",
} as const;

const SoccerBall: React.FC = () => {
  const [modalState, setModalState] = useState<ModalType>(null);

  const getModalContent = useCallback(
    (state: ModalType): ModalContent | null => {
      switch (state) {
        case "success":
          return {
            title: "Payment Successful! 🎉",
            message: "Thank you for your purchase!",
          };
        case "cancel":
          return {
            title: "Payment Cancelled",
            message: "Your payment was cancelled.",
          };
        case "error":
          return {
            title: "Payment Error",
            message:
              "There was an error processing your payment. Please try again.",
          };
        default:
          return null;
      }
    },
    []
  );

  const modalContent = getModalContent(modalState);

  return (
    <div className="soccer-ball-container" data-testid="soccer-ball-container">
      {modalContent && (
        <PaymentModal
          content={modalContent}
          onClose={() => setModalState(null)}
        />
      )}

      <ProductDisplay product={PRODUCT} />

      <div className="payment-options">
        <PayPalButton setModalState={setModalState} />
      </div>
    </div>
  );
};

export default SoccerBall;

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(useGSAP);

export default function LogoutButton() {
  const buttonRef = useRef(null);
  const bubbleRef = useRef(null);
  const textRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const xMove = useRef(null);
  const yMove = useRef(null);

  useGSAP(() => {
    // Initialize quickTo for cursor follow
    xMove.current = gsap.quickTo(bubbleRef.current, "x", {duration: 0.4, ease: "power3", xPercent: -50});
    yMove.current = gsap.quickTo(bubbleRef.current, "y", {duration: 0.4, ease: "power3", yPercent: -50});

    // Initial state for bubble
    gsap.set(bubbleRef.current, { scale: 0, top: 0, left: 0 });
  }, { scope: buttonRef });

  const { contextSafe } = useGSAP({ scope: buttonRef });

  const handleMouseMove = contextSafe((e) => {
    const { left, top } = buttonRef.current.getBoundingClientRect();
    xMove.current(e.clientX - left);
    yMove.current(e.clientY - top);
  });

  const handleMouseEnter = contextSafe(() => {
    gsap.to(bubbleRef.current, {
      scale: 2.5,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    });
    gsap.to(textRef.current, {
      color: "#ffffff", // white text on hover for contrast against the red bubble
      duration: 0.3
    });
    gsap.to(buttonRef.current, {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out"
    });
  });

  const handleMouseLeave = contextSafe(() => {
    gsap.to(bubbleRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power2.out"
    });
    gsap.to(textRef.current, {
      color: "#ef4444", // revert back to red text
      duration: 0.3
    });
    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  });

  const handleClick = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      ref={buttonRef}
      className="logout-button"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label="Logout"
    >
      <span ref={textRef} className="logout-text">Logout</span>
      <span ref={bubbleRef} className="logout-bubble"></span>
    </button>
  );
}

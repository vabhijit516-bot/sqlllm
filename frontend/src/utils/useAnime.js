import { useEffect } from 'react';
import anime from 'animejs';

/**
 * Hook to apply Anime.js staggered spring entrance animation to grid items or list elements.
 */
export function useAnimeStagger(containerRef, selector, dependency = [], options = {}) {
  useEffect(() => {
    if (!containerRef || !containerRef.current) return;
    const targets = containerRef.current.querySelectorAll(selector);
    if (targets.length === 0) return;

    anime({
      targets: targets,
      translateY: options.translateY || [25, 0],
      opacity: [0, 1],
      scale: options.scale || [0.94, 1],
      delay: anime.stagger(options.staggerMs || 70, { start: options.startMs || 50 }),
      duration: options.duration || 650,
      easing: options.easing || 'cubicBezier(0.16, 1, 0.3, 1)'
    });
  }, dependency);
}

/**
 * Interactive 3D tilt hook tracking cursor movement over cards.
 */
export function useAnimeTilt(containerRef, selector, dependency = []) {
  useEffect(() => {
    if (!containerRef || !containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(selector);

    const handleMouseMove = (e) => {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      anime({
        targets: card,
        rotateX: -y * 0.08,
        rotateY: x * 0.08,
        scale: 1.02,
        duration: 200,
        easing: 'easeOutQuad'
      });
    };

    const handleMouseLeave = (e) => {
      anime({
        targets: e.currentTarget,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 400,
        easing: 'easeOutSine'
      });
    };

    cards.forEach((card) => {
      card.style.perspective = '1000px';
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, dependency);
}

/**
 * Spring pop micro-interaction for button clicks and interactive elements.
 */
export function animateClick(target) {
  if (!target) return;
  const element = target.currentTarget || target;
  anime.remove(element);
  
  // Scale spring pop
  anime({
    targets: element,
    scale: [1, 0.92, 1.05, 1],
    duration: 380,
    easing: 'easeOutElastic(1, 0.6)'
  });

  // Visual light flash aura
  anime({
    targets: element,
    borderColor: ['rgba(0, 242, 254, 0.8)', 'rgba(58, 73, 75, 0.5)'],
    duration: 600,
    easing: 'easeOutQuad'
  });
}

/**
 * Animated elastic pop-in for modal dialogs.
 */
export function animateModalIn(modalCardRef) {
  if (!modalCardRef || !modalCardRef.current) return;
  anime({
    targets: modalCardRef.current,
    scale: [0.88, 1],
    translateY: [24, 0],
    opacity: [0, 1],
    rotateX: [-8, 0],
    duration: 550,
    easing: 'cubicBezier(0.16, 1, 0.3, 1)'
  });
}

/**
 * Tab switch smooth transition animation.
 */
export function animateTabSwitch(tabContainerRef) {
  if (!tabContainerRef || !tabContainerRef.current) return;
  anime({
    targets: tabContainerRef.current,
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 400,
    easing: 'easeOutCubic'
  });
}

/**
 * Animated collapse / expand accordion transition.
 */
export function animateAccordion(element, isExpanding, onComplete) {
  if (!element) return;
  anime.remove(element);
  if (isExpanding) {
    anime({
      targets: element,
      height: [0, element.scrollHeight],
      opacity: [0, 1],
      duration: 350,
      easing: 'easeOutCubic',
      complete: () => {
        element.style.height = 'auto';
        if (onComplete) onComplete();
      }
    });
  } else {
    anime({
      targets: element,
      height: [element.offsetHeight, 0],
      opacity: [1, 0],
      duration: 250,
      easing: 'easeInCubic',
      complete: () => {
        if (onComplete) onComplete();
      }
    });
  }
}

/**
 * Animated pulse aura effect for SQL blocks and glowing cards.
 */
export function animatePulseAura(targetRef) {
  if (!targetRef || !targetRef.current) return;
  anime({
    targets: targetRef.current,
    boxShadow: [
      '0 0 0px rgba(0, 242, 254, 0)',
      '0 0 25px rgba(0, 242, 254, 0.35)',
      '0 0 0px rgba(0, 242, 254, 0)'
    ],
    duration: 3200,
    loop: true,
    easing: 'easeInOutSine'
  });
}

/**
 * Gentle infinite floating animation for cards or hero graphic.
 */
export function animateFloat(targetRef) {
  if (!targetRef || !targetRef.current) return;
  anime({
    targets: targetRef.current,
    translateY: [-4, 4],
    duration: 2800,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutQuad'
  });
}



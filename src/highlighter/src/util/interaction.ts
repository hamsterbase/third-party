/**
 * adapter for mobile and desktop events
 */

import type { IInteraction } from '../types/index.js';
import { UserInputEvent } from '../types/index.js';
import detectMobile from './is.mobile.js';

export default (): IInteraction => {
  const isMobile = detectMobile(window.navigator.userAgent);

  const interaction: IInteraction = {
    PointerEnd: isMobile ? UserInputEvent.touchend : UserInputEvent.mouseup,
    PointerTap: isMobile ? UserInputEvent.touchstart : UserInputEvent.click,
    // hover and click will be the same event in mobile
    PointerOver: isMobile
      ? UserInputEvent.touchstart
      : UserInputEvent.mouseover,
  };

  return interaction;
};

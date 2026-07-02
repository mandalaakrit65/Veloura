/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AndroidFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div 
      className="w-full h-screen md:max-w-md md:h-[92vh] md:rounded-[40px] md:border md:border-white/50 md:shadow-2xl bg-gradient-to-br from-[#FFD6F3]/50 via-[#FAF7F9]/90 to-[#F5E6FF]/60 backdrop-blur-xl flex flex-col relative overflow-hidden transition-all duration-300" 
      id="veloura-app-container"
    >
      {children}
    </div>
  );
};

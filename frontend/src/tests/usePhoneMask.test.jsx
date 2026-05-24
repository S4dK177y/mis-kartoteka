import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePhoneMask } from '../hooks/usePhoneMask';

const TestComponent = () => {
  const [formData, setFormData] = useState({ phone: '' });
  const { handlePhoneChange } = usePhoneMask();

  return (
    <input
      data-testid="phone-input"
      name="phone"
      value={formData.phone}
      onChange={(e) => handlePhoneChange(e, setFormData)}
    />
  );
};

describe('usePhoneMask hook', () => {
  it('should format phone numbers correctly starting with 7, 8, or 9', () => {
    render(<TestComponent />);
    const input = screen.getByTestId('phone-input');

    // User types "9123456789"
    fireEvent.change(input, { target: { name: 'phone', value: '9123456789' } });
    expect(input.value).toBe('+7-912-345-67-89');

    // User types "89991112233"
    fireEvent.change(input, { target: { name: 'phone', value: '89991112233' } });
    expect(input.value).toBe('+7-999-111-22-33');
  });

  it('should clear the input when empty string is provided', () => {
    render(<TestComponent />);
    const input = screen.getByTestId('phone-input');

    fireEvent.change(input, { target: { name: 'phone', value: '' } });
    expect(input.value).toBe('');
  });
});

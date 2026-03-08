import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from './ColorPicker';

describe('ColorPicker', () => {
  const defaultProps = {
    label: 'Foreground Color',
    color: '#FF5500',
    onChange: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<ColorPicker {...defaultProps} />);

    expect(screen.getByText('Foreground Color')).toBeDefined();
  });

  it('displays the label correctly', () => {
    render(<ColorPicker {...defaultProps} />);

    const label = screen.getByText('Foreground Color');
    expect(label).toBeDefined();
    expect(label.tagName).toBe('LABEL');
  });

  it('generates correct id from label with spaces', () => {
    render(<ColorPicker {...defaultProps} label="Background Color" />);

    const textInput = screen.getByRole('textbox');
    expect(textInput.id).toBe('background-color');
  });

  it('displays the current color value in text input', () => {
    render(<ColorPicker {...defaultProps} />);

    const textInput = screen.getByRole('textbox');
    expect(textInput).toHaveProperty('value', '#FF5500');
  });

  it('displays the current color value in color picker', () => {
    render(<ColorPicker {...defaultProps} />);

    const colorInput = screen.getByLabelText('Foreground Color Picker');
    expect(colorInput).toHaveProperty('value', '#ff5500');
  });

  it('calls onChange when text input changes', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const textInput = screen.getByRole('textbox');
    fireEvent.change(textInput, { target: { value: '#00FF00' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#00FF00');
  });

  it('calls onChange when color picker changes', () => {
    const onChange = vi.fn();
    render(<ColorPicker {...defaultProps} onChange={onChange} />);

    const colorInput = screen.getByLabelText('Foreground Color Picker');
    fireEvent.change(colorInput, { target: { value: '#0000ff' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('#0000ff');
  });

  it('renders both color and text inputs', () => {
    render(<ColorPicker {...defaultProps} />);

    const colorInput = screen.getByLabelText('Foreground Color Picker');
    const textInput = screen.getByRole('textbox');

    expect(colorInput).toBeDefined();
    expect(textInput).toBeDefined();
    expect(colorInput).toHaveProperty('type', 'color');
    expect(textInput).toHaveProperty('type', 'text');
  });

  it('has correct placeholder on text input', () => {
    render(<ColorPicker {...defaultProps} />);

    const textInput = screen.getByRole('textbox');
    expect(textInput).toHaveProperty('placeholder', '#000000');
  });

  it('handles different label values', () => {
    render(<ColorPicker {...defaultProps} label="Test Label" />);

    expect(screen.getByText('Test Label')).toBeDefined();
    expect(screen.getByLabelText('Test Label Picker')).toBeDefined();
  });
});

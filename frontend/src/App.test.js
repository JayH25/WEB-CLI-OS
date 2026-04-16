import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue({ output: 'Command executed successfully.' })
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders the terminal prompt and echoes submitted commands', async () => {
  render(<App />);

  expect(screen.getByText('user@web-os:~$')).toBeInTheDocument();

  const input = screen.getByLabelText('Terminal command input');

  fireEvent.change(input, { target: { value: 'help' } });
  fireEvent.submit(input.closest('form'));

  expect(screen.getByText('user@web-os:~$ help')).toBeInTheDocument();
  expect(input).toHaveValue('');

  await waitFor(() => {
    expect(screen.getByText('Command executed successfully.')).toBeInTheDocument();
  });
});

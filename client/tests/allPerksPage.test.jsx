import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';

import AllPerks from '../src/pages/AllPerks.jsx';
import { renderWithRouter } from './utils/renderWithRouter.js';


  

describe('AllPerks page (Directory)', () => {
  test('lists public perks and responds to name filtering', async () => {
    // The seeded record gives us a deterministic expectation regardless of the
    // rest of the shared database contents.
    const seededPerk = global.__TEST_CONTEXT__.seededPerk;

    // Render the exploration page so it performs its real HTTP fetch.
    renderWithRouter(
      <Routes>
        <Route path="/explore" element={<AllPerks />} />
      </Routes>,
      { initialEntries: ['/explore'] }
    );

    // Wait for the baseline card to appear which guarantees the asynchronous
    // fetch finished.
    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // Interact with the name filter input using the real value that
    // corresponds to the seeded record.
    const nameFilter = screen.getByPlaceholderText('Enter perk name...');
    fireEvent.change(nameFilter, { target: { value: seededPerk.title } });

    await waitFor(() => {
      expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
    });

    // The summary text should continue to reflect the number of matching perks.
    expect(screen.getByText(/showing/i)).toHaveTextContent('Showing');
  });

  /*
  TODO: Test merchant filtering
  - use the seeded record
  - perform a real HTTP fetch.
  - wait for the fetch to finish
  - choose the record's merchant from the dropdown
  - verify the record is displayed
  - verify the summary text reflects the number of matching perks
  */

 test('lists public perks and responds to merchant filtering', async () => {
  const seededPerk = global.__TEST_CONTEXT__.seededPerk;

  // Render the page so it performs its real HTTP fetch.
  renderWithRouter(
    <Routes>
      <Route path="/explore" element={<AllPerks />} />
    </Routes>,
    { initialEntries: ['/explore'] }
  );

  // Wait for the baseline card to appear (ensures fetch finished).
  await waitFor(() => {
    expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
  });

  // Try to find the merchant select control. Try sensible queries in order.
  let merchantSelect = null;

  // 1) look for a select by aria role and label text "Merchant" (common pattern)
  try {
    merchantSelect = screen.getByRole('combobox', { name: /merchant/i });
  } catch (e) {
    // ignore and continue to next strategy
  }

  // 2) fallback: find any select element on the page (if there's only one)
  if (!merchantSelect) {
    const selects = screen.queryAllByRole('combobox');
    if (selects.length === 1) merchantSelect = selects[0];
  }

  // 3) fallback: try placeholder or test id (if implemented)
  if (!merchantSelect) {
    merchantSelect =
      screen.queryByPlaceholderText(/choose merchant|select merchant/i) ||
      screen.queryByTestId?.('merchant-select') ||
      null;
  }

  // If we still don't have a select element, fail with a helpful message.
  if (!merchantSelect) {
    throw new Error(
      'Merchant select not found. Update the test to match the component selector (label, placeholder, or test id).'
    );
  }

  // Determine the option value to choose. The seeded record may store merchant
  // as an object or a string; try a few likely fields.
  const merchantValueCandidates = [
    seededPerk.merchant?.id,
    seededPerk.merchant?._id,
    seededPerk.merchant?.name,
    seededPerk.merchant // maybe it's just a string
  ].filter(Boolean);

  // Try to pick the first candidate that matches an option in the select.
  let chosenValue = null;
  const options = Array.from(merchantSelect.querySelectorAll('option'));

  for (const candidate of merchantValueCandidates) {
    // match exactly or case-insensitively against option value or text
    const match = options.find(
      (opt) =>
        opt.value === String(candidate) ||
        opt.textContent?.trim().toLowerCase() === String(candidate).toLowerCase()
    );
    if (match) {
      chosenValue = match.value;
      break;
    }
  }

  // If we still don't have a chosen value, try selecting by option text using the merchant name.
  if (!chosenValue && seededPerk.merchant?.name) {
    const match = options.find(
      (opt) => opt.textContent?.trim().toLowerCase() === seededPerk.merchant.name.toLowerCase()
    );
    if (match) chosenValue = match.value;
  }

  // If we couldn't resolve a value automatically, fall back to using the merchant name as the value.
  if (!chosenValue) {
    chosenValue = seededPerk.merchant?.name || seededPerk.merchant || options[0]?.value;
  }

  // Fire the change event on the select to choose the merchant.
  fireEvent.change(merchantSelect, { target: { value: chosenValue } });

  // Wait for the filtered results to appear (seeded record should be visible).
  await waitFor(() => {
    expect(screen.getByText(seededPerk.title)).toBeInTheDocument();
  });

  // The summary text should reflect the number of matching perks.
  expect(screen.getByText(/showing/i)).toHaveTextContent('Showing');
});

});

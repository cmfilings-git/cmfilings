import { getApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { doc, getDoc, getFirestore, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const companyStates = {
  IN: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'],
  AE: ['Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain'],
  US: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  CA: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
  AU: ['Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'],
  GB: ['England', 'Northern Ireland', 'Scotland', 'Wales']
};

const fields = {
  compName: 'name',
  compTagline: 'tagline',
  compFloor: 'floor',
  compBuildingNo: 'buildingNo',
  compBuildingName: 'buildingName',
  compArea: 'area',
  compDistrict: 'district',
  compPostalCode: 'postalCode',
  compPhone1: 'phone1',
  compPhone2: 'phone2',
  compEmail: 'email',
  compWebsite: 'website',
  compSignatoryName: 'authorisedSignatoryName',
  compSignatoryDesignation: 'authorisedSignatoryDesignation',
  compSignatoryQualification: 'authorisedSignatoryQualificationLicence',
  compAccName: 'accName',
  compAccNo: 'accNo',
  compIfsc: 'ifsc',
  compUpi: 'upi'
};

export async function loadCompanyLocale(db, notify = () => {}) {
  try {
    const snapshot = await getDoc(doc(db, 'settings', 'company_profile'));
    if (!snapshot.exists()) {
      try {
        return localStorage.getItem('corebiq-company-name') || '';
      } catch (error) {
        console.warn('Unable to read the cached company name:', error);
        return '';
      }
    }
    const data = snapshot.data();
    window.applyCorebiqSettings?.({
      currencyCode: data.currencyCode || data.currency,
      countryCode: data.countryCode || data.country,
      preferredLanguage: data.preferredLanguage || data.language
    });
    if (data.name) {
      try {
        localStorage.setItem('corebiq-company-name', data.name);
      } catch (error) {
        console.warn('Unable to cache the company name:', error);
      }
    }
    return data.name || '';
  } catch (error) {
    console.error('Unable to load saved company locale settings:', error);
    notify('Company language settings could not be loaded.');
    try {
      return localStorage.getItem('corebiq-company-name') || '';
    } catch (storageError) {
      console.warn('Unable to read the cached company name:', storageError);
      return '';
    }
  }
}

function parseLegacyAddress(address) {
  const result = { floor: '', buildingNo: '', buildingName: '', area: '', district: '', postalCode: '', state: '', countryCode: 'IN' };
  const parts = String(address || '').split(',').map(part => part.trim()).filter(Boolean);
  if (!parts.length) return result;
  result.postalCode = String(address).match(/\b\d{5,6}\b/)?.[0] || '';
  const floorIndex = parts.findIndex(part => /\bfloor\b/i.test(part));
  if (floorIndex >= 0) result.floor = parts.splice(floorIndex, 1)[0];
  const buildingNoIndex = parts.findIndex(part => /(?:building\s*)?(?:no\.?|number)\s*[:#-]?\s*\w+/i.test(part));
  if (buildingNoIndex >= 0) result.buildingNo = parts.splice(buildingNoIndex, 1)[0].replace(/^(?:building\s*)?(?:no\.?|number)\s*[:#-]?\s*/i, '');
  const districtIndex = parts.findIndex(part => /\bdistrict\b|\bdist\.?\b/i.test(part));
  if (districtIndex >= 0) result.district = parts.splice(districtIndex, 1)[0].replace(/\s*(?:district|dist\.?)\s*/ig, '').trim();
  const stateIndex = parts.findIndex(part => /\b(kerala|karnataka|tamil nadu|maharashtra|goa|gujarat|delhi|punjab|rajasthan|uttar pradesh|telangana|andhra pradesh)\b/i.test(part));
  if (stateIndex >= 0) result.state = parts.splice(stateIndex, 1)[0].replace(/[-\s]+\d{5,6}\s*$/, '').trim();
  if (parts.length) result.buildingName = parts.shift();
  if (parts.length) result.area = parts.shift();
  if (result.state || /india/i.test(address)) result.countryCode = 'IN';
  return result;
}

function populateCurrencies(select) {
  if (typeof Intl.supportedValuesOf !== 'function') return;
  const selected = select.value || 'INR';
  try {
    const currencies = Intl.supportedValuesOf('currency');
    const names = typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames(['en'], { type: 'currency' })
      : null;
    select.replaceChildren();
    currencies.forEach(code => select.add(new Option(`${code} — ${names?.of(code) || code}`, code)));
    if (!currencies.includes(selected)) select.add(new Option(`${selected} — ${selected}`, selected));
    select.value = selected;
  } catch (error) {
    console.warn('Unable to load the full currency list:', error);
  }
}

export async function renderCompanyPage(container, notify, isCurrentView = () => true) {
  let response;
  try {
    response = await fetch('company.html');
    if (!response.ok) throw new Error(`Company page request failed with HTTP ${response.status}`);
  } catch (error) {
    console.error('Unable to load company page:', error);
    notify('Company profile could not be loaded.');
    return;
  }

  const markup = await response.text();
  const fragment = markup.split(/<script\b/i, 1)[0];
  const parsed = new DOMParser().parseFromString(fragment, 'text/html');
  if (!isCurrentView()) return;
  const page = document.createElement('div');
  page.className = 'company-view';
  page.append(...parsed.body.childNodes);
  container.replaceChildren(page);

  const db = getFirestore(getApp());
  const profileRef = doc(db, 'settings', 'company_profile');
  const byId = id => page.querySelector(`#${id}`);
  const stateSelect = byId('compState');
  const countrySelect = byId('compCountry');
  const currencySelect = byId('compCurrency');
  populateCurrencies(currencySelect);
  const storedLocale = {
    countryCode: localStorage.getItem('corebiq-country') || 'IN',
    currencyCode: localStorage.getItem('corebiq-currency') || 'INR',
    preferredLanguage: localStorage.getItem('corebiq-language') || 'en'
  };
  if (!Array.from(countrySelect.options).some(option => option.value === storedLocale.countryCode)) {
    countrySelect.add(new Option(storedLocale.countryCode, storedLocale.countryCode));
  }
  countrySelect.value = storedLocale.countryCode;
  if (!Array.from(currencySelect.options).some(option => option.value === storedLocale.currencyCode)) {
    currencySelect.add(new Option(`${storedLocale.currencyCode} — ${storedLocale.currencyCode}`, storedLocale.currencyCode));
  }
  currencySelect.value = storedLocale.currencyCode;

  const updateStates = (selected = '') => {
    const states = companyStates[countrySelect.value] || ['Other / not listed'];
    stateSelect.replaceChildren(new Option('Select state / region', ''));
    states.forEach(state => stateSelect.add(new Option(state, state)));
    if (selected && !states.includes(selected)) stateSelect.add(new Option(selected, selected));
    stateSelect.value = selected;
  };

  updateStates();

  const applyLocale = () => window.applyCorebiqSettings?.({
    currencyCode: currencySelect.value,
    countryCode: countrySelect.value,
    preferredLanguage: byId('compLanguage').value
  });
  countrySelect.addEventListener('change', () => {
    updateStates();
    applyLocale();
  });
  currencySelect.addEventListener('change', applyLocale);
  byId('compLanguage').value = storedLocale.preferredLanguage;
  byId('compLanguage').addEventListener('change', applyLocale);
  applyLocale();

  const snapshot = await getDoc(profileRef).catch(error => {
    console.error('Unable to load company details:', error);
    notify('Company details could not be loaded. Check Firestore access and try again.');
    return null;
  });
  if (!isCurrentView()) return;

  if (snapshot?.exists()) {
    const data = snapshot.data();
    const legacy = parseLegacyAddress(data.address);
    Object.entries(fields).forEach(([id, key]) => {
      if (data[key] !== undefined && data[key] !== null) byId(id).value = data[key];
    });

    ['floor', 'buildingNo', 'buildingName', 'area', 'district', 'postalCode'].forEach(key => {
      if (!data[key] && legacy[key]) {
        const id = `comp${key[0].toUpperCase()}${key.slice(1)}`;
        byId(id).value = legacy[key];
      }
    });

    const countryCode = data.countryCode || legacy.countryCode || storedLocale.countryCode;
    if (!Array.from(countrySelect.options).some(option => option.value === countryCode)) {
      countrySelect.add(new Option(data.country || countryCode, countryCode));
    }
    countrySelect.value = countryCode;
    updateStates(data.state || legacy.state || '');
    const currencyCode = String(data.currencyCode || data.currency || storedLocale.currencyCode).toUpperCase();
    if (!Array.from(currencySelect.options).some(option => option.value === currencyCode)) {
      currencySelect.add(new Option(`${currencyCode} — ${currencyCode}`, currencyCode));
    }
    currencySelect.value = currencyCode;
    byId('compLanguage').value = data.preferredLanguage || data.language || storedLocale.preferredLanguage;
    applyLocale();
    try {
      if (data.name) localStorage.setItem('corebiq-company-name', data.name);
    } catch (error) {
      console.warn('Unable to cache the company name:', error);
    }
  }

  const controls = Array.from(page.querySelectorAll('#company-overview-form .readonly-input'));
  const editButton = byId('editCompanyBtn');
  const saveActions = byId('save-actions');
  let originalValues = new Map();
  const captureValues = () => new Map(controls.map(control => [control.id, control.value]));
  const setEditing = editing => {
    if (editing) originalValues = captureValues();
    controls.forEach(control => {
      control.classList.toggle('editable', editing);
      if (control instanceof HTMLSelectElement) control.disabled = !editing;
      else control.toggleAttribute('readonly', !editing);
    });
    saveActions.hidden = !editing;
    editButton.hidden = editing;
  };

  editButton.addEventListener('click', () => setEditing(true));
  byId('cancelCompanyBtn').addEventListener('click', () => {
    const country = originalValues.get('compCountry');
    if (country) countrySelect.value = country;
    updateStates(originalValues.get('compState') || '');
    controls.forEach(control => {
      if (control.id === 'compState') return;
      control.value = originalValues.get(control.id) ?? control.value;
    });
    applyLocale();
    setEditing(false);
  });

  byId('saveCompanyBtn').addEventListener('click', async () => {
    const button = byId('saveCompanyBtn');
    const label = byId('save-company-label');
    button.disabled = true;
    label.textContent = 'Saving...';

    const address = [
      'compFloor', 'compBuildingNo', 'compBuildingName', 'compArea',
      'compDistrict', 'compState', 'compPostalCode'
    ].map(id => byId(id).value.trim()).filter(Boolean);
    const country = countrySelect.selectedOptions[0]?.textContent.trim() || '';
    if (country) address.push(country);
    const payload = Object.fromEntries(Object.entries(fields).map(([id, key]) => [key, byId(id).value.trim()]));
    Object.assign(payload, {
      state: stateSelect.value,
      countryCode: countrySelect.value,
      country,
      currencyCode: currencySelect.value,
      preferredLanguage: byId('compLanguage').value,
      address: address.join(', '),
      updatedAt: new Date()
    });

    try {
      await setDoc(profileRef, payload, { merge: true });
      applyLocale();
      try {
        localStorage.setItem('corebiq-company-name', payload.name);
      } catch (error) {
        console.warn('Unable to cache the updated company name:', error);
      }
      originalValues = captureValues();
      setEditing(false);
      notify('Company details saved.');
    } catch (error) {
      console.error('Unable to save company details:', error);
      notify('Company details could not be saved. Check Firestore access and try again.');
    } finally {
      button.disabled = false;
      label.textContent = 'Save changes';
    }
  });

  lucide.createIcons();
}

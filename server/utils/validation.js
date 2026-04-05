const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const toNumber = (value) => Number(value);

export const validateClient = (clientData) => {
  const errors = [];

  if (!clientData.name || clientData.name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caracteres');
  }

  if (!clientData.firstname || clientData.firstname.trim().length < 2) {
    errors.push('Le prenom doit contenir au moins 2 caracteres');
  }

  if (!clientData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
    errors.push('Email invalide');
  }

  if (!clientData.phone || !/^[\d\s\-()+]+$/.test(clientData.phone)) {
    errors.push('Numero de telephone invalide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateProperty = (propertyData) => {
  const errors = [];
  const propertyType = typeof propertyData.type === 'string' ? propertyData.type.trim().toLowerCase() : '';
  const price = toNumber(propertyData.price);
  const area = toNumber(propertyData.area);
  const rooms = toNumber(propertyData.rooms);

  if (!propertyData.address || propertyData.address.trim().length < 5) {
    errors.push("L'adresse doit contenir au moins 5 caracteres");
  }

  if (!propertyType || !['appartement', 'maison', 'terrain', 'bureau'].includes(propertyType)) {
    errors.push('Type de bien invalide');
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.push('Le prix doit etre superieur a 0');
  }

  if (!Number.isFinite(area) || area <= 0) {
    errors.push('La surface doit etre superieure a 0');
  }

  if (!Number.isFinite(rooms) || (propertyType === 'terrain' ? rooms < 0 : rooms <= 0)) {
    errors.push(propertyType === 'terrain'
      ? 'Le nombre de pieces ne peut pas etre negatif'
      : 'Le nombre de pieces doit etre superieur a 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEvent = (eventData) => {
  const errors = [];
  const clientId = eventData.client_id === '' || eventData.client_id == null ? null : toNumber(eventData.client_id);
  const propertyId = eventData.property_id === '' || eventData.property_id == null ? null : toNumber(eventData.property_id);

  if (!eventData.title || eventData.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caracteres');
  }

  if (!eventData.start_date || !isValidDate(eventData.start_date)) {
    errors.push('Date de debut invalide');
  }

  if (!eventData.end_date || !isValidDate(eventData.end_date)) {
    errors.push('Date de fin invalide');
  }

  if (isValidDate(eventData.start_date) && isValidDate(eventData.end_date)) {
    const startDate = new Date(eventData.start_date);
    const endDate = new Date(eventData.end_date);

    if (endDate <= startDate) {
      errors.push('La date de fin doit etre apres la date de debut');
    }
  }

  if (clientId !== null && (!Number.isInteger(clientId) || clientId <= 0)) {
    errors.push('ID client invalide');
  }

  if (propertyId !== null && (!Number.isInteger(propertyId) || propertyId <= 0)) {
    errors.push('ID bien invalide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateContract = (contractData) => {
  const errors = [];
  const clientId = toNumber(contractData.client_id);
  const propertyId = toNumber(contractData.property_id);
  const amount = toNumber(contractData.amount);
  const contractType = typeof contractData.type === 'string' ? contractData.type.trim().toLowerCase() : '';
  const contractStatus = typeof contractData.status === 'string' ? contractData.status.trim().toLowerCase() : '';

  if (!Number.isInteger(clientId) || clientId <= 0) {
    errors.push('ID client invalide');
  }

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    errors.push('ID bien invalide');
  }

  if (!contractType || !['location', 'vente'].includes(contractType)) {
    errors.push('Type de contrat invalide');
  }

  if (!contractData.start_date || !isValidDate(contractData.start_date)) {
    errors.push('Date de debut invalide');
  }

  if (!contractData.end_date || !isValidDate(contractData.end_date)) {
    errors.push('Date de fin invalide');
  }

  if (isValidDate(contractData.start_date) && isValidDate(contractData.end_date)) {
    const startDate = new Date(contractData.start_date);
    const endDate = new Date(contractData.end_date);

    if (endDate < startDate) {
      errors.push('La date de fin ne peut pas etre avant la date de debut');
    }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push('Montant invalide');
  }

  if (!contractStatus || !['actif', 'termine', 'annule'].includes(contractStatus.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    errors.push('Statut invalide');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

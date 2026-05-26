import { UserPlus, Edit, Trash2, FileUp, ArrowLeftRight, LogIn, LogOut, Settings } from 'lucide-react';

export const ACTION_META = {
  CREATE:   { label: 'Создание',         color: '#166534', bg: '#dcfce7', icon: UserPlus },
  UPDATE:   { label: 'Обновление',       color: '#92400e', bg: '#fef3c7', icon: Edit },
  DELETE:   { label: 'Удаление',         color: '#991b1b', bg: '#fee2e2', icon: Trash2 },
  UPLOAD:   { label: 'Загрузка файла',   color: '#1e3a8a', bg: '#dbeafe', icon: FileUp },
  TRANSFER: { label: 'Перевод',          color: '#5b21b6', bg: '#ede9fe', icon: ArrowLeftRight },
  LOGIN:    { label: 'Вход в систему',   color: '#065f46', bg: '#d1fae5', icon: LogIn },
  LOGOUT:   { label: 'Выход из системы', color: '#374151', bg: '#f3f4f6', icon: LogOut },
  SYSTEM:   { label: 'Системное',        color: '#1e3a8a', bg: '#dbeafe', icon: Settings },
};

export const ENTITY_LABELS = {
  Patient:        'Пациент',
  Consultation:   'Консультация',
  User:           'Пользователь',
  Document:       'Документ',
  'Document VVK': 'Документ ВВК',
  Settings:       'Настройки',
};

export const FIELD_LABELS = {
  fullName:            'ФИО',
  rank:                'Звание',
  militaryUnit:        'В/ч',
  militaryStatus:      'Статус службы',
  department:          'Отделение',
  status:              'Статус',
  admissionDiagnosis:  'Диагноз при поступлении',
  clinicalDiagnosis:   'Клинический диагноз',
  finalDiagnosis:      'Заключительный диагноз',
  complications:       'Осложнения',
  dischargeDestination:'Место выписки',
  dischargeDate:       'Дата выписки',
  admissionDate:       'Дата поступления',
  birthDate:           'Дата рождения',
  caseHistoryNumber:   'Номер ИБ',
  tokenNumber:         'Жетон',
  isSvoParticipant:    'Участник СВО',
  diagnosis:           'Диагноз',
  username:            'Логин',
  role:                'Роль',
  newRole:             'Новая роль',
  from:                'Из',
  to:                  'В',
  previousDepartment:  'Предыдущее отделение',
  newDepartment:       'Новое отделение',
  originalName:        'Имя файла',
  size:                'Размер',
  mimetype:            'Тип файла'
};

export const formatFieldValue = (key, val) => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Да' : 'Нет';
  if (key.toLowerCase().includes('date') && typeof val === 'string' && val.includes('T')) {
    return new Date(val).toLocaleString('ru-RU');
  }
  return String(val);
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const HIDDEN_KEYS = new Set(['entityId', 'consultationId', 'patientId', 'personId', 'documentId']);
export const COUNT_KEYS = {
  patientsMigrated:      'Пациентов',
  consultationsMigrated: 'Консультаций',
  usersMigrated:         'Пользователей',
  documentsMigrated:     'Документов',
  vvkConclusionsMigrated:'Заключений ВВК',
};

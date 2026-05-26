import React from 'react';
import DatePicker from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { MILITARY_RANKS_GROUPS } from '../../ranks';

export const PatientDataSection = ({ formData, birthDate, setBirthDate, handleChange, isOtherRank }) => {
  return (
    <>
      <div className="grid-2">
        <div className="input-group">
          <label className="input-label">ФИО (Полностью) *</label>
          <input type="text" name="fullName" className="input-field" required value={formData.fullName} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Дата рождения *</label>
          <DatePicker
            selected={birthDate}
            onChange={(date) => setBirthDate(date)}
            dateFormat="dd.MM.yyyy"
            locale={ru}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            className="input-field"
            placeholderText="ДД.ММ.ГГГГ"
            required
          />
        </div>
      </div>
      
      <div className="grid-2">
        <div className="input-group">
          <label className="input-label">Воинское звание / Категория</label>
          <select name="rank" className="input-field" value={formData.rank} onChange={handleChange}>
            <option value="">Не указано</option>
            {MILITARY_RANKS_GROUPS.map((group, idx) => (
              <optgroup key={idx} label={group.label}>
                {group.options.map(r => <option key={r} value={r}>{r}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Номер в/ч</label>
          <input type="text" name="militaryUnit" className="input-field" value={formData.militaryUnit} onChange={handleChange} />
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="input-group">
          <label className="input-label">Статус службы</label>
          <div className="flex gap-4 mt-2">
            <label className={`flex items-center gap-2 ${isOtherRank ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="militaryStatus" value="Призыв" checked={formData.militaryStatus === 'Призыв'} onChange={handleChange} disabled={isOtherRank} />
              <span>По призыву</span>
            </label>
            <label className={`flex items-center gap-2 ${isOtherRank ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="radio" name="militaryStatus" value="Контракт" checked={formData.militaryStatus === 'Контракт'} onChange={handleChange} disabled={isOtherRank} />
              <span>По контракту</span>
            </label>
          </div>
        </div>
        
        {formData.militaryStatus === 'Контракт' && (
          <div className="input-group">
            <label className="input-label" style={{ visibility: 'hidden' }}>Выравнивание</label>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" name="isSvoParticipant" checked={formData.isSvoParticipant} onChange={handleChange} />
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>Участник СВО</span>
            </label>
          </div>
        )}
      </div>

      <div className="grid-2 mt-2">
        <div className="input-group">
          <label className="input-label">Личный номер (Жетон)</label>
          <input type="text" name="tokenNumber" className="input-field" placeholder="АВ-123456" value={formData.tokenNumber} onChange={handleChange} />
        </div>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label">Адрес проживания</label>
          <input type="text" name="address" className="input-field" value={formData.address} onChange={handleChange} />
        </div>
      </div>
      
      <div className="input-group mt-4 mb-2">
        <label className="input-label">Номер телефона пациента</label>
        <input type="text" name="phoneNumber" className="input-field" value={formData.phoneNumber} onChange={handleChange} placeholder="+7-___-___-__-__" />
      </div>

      <div className="card p-4 mt-4" style={{ background: 'var(--bg-main)' }}>
        <h4 className="text-md font-bold mb-3 text-primary">Контактные данные близкого человека</h4>
        <div className="grid-2">
          <div className="input-group">
            <label className="input-label">Кем приходится (статус)</label>
            <input type="text" name="relativeRelation" className="input-field" value={formData.relativeRelation} onChange={handleChange} placeholder="Жена, Брат, Сын и т.д." />
          </div>
          <div className="input-group">
            <label className="input-label">ФИО близкого</label>
            <input type="text" name="relativeFullName" className="input-field" value={formData.relativeFullName} onChange={handleChange} placeholder="Иванова Мария Ивановна" />
          </div>
        </div>
        <div className="grid-2 mt-2">
          <div className="input-group">
            <label className="input-label">Номер телефона</label>
            <input type="text" name="relativePhone" className="input-field" value={formData.relativePhone} onChange={handleChange} placeholder="+7-___-___-__-__" />
          </div>
          <div className="input-group">
            <label className="input-label">Адрес проживания</label>
            <input type="text" name="relativeAddress" className="input-field" value={formData.relativeAddress} onChange={handleChange} placeholder="Город, Улица, Дом" />
          </div>
        </div>
      </div>
    </>
  );
};

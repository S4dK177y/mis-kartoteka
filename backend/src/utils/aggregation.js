function aggregatePersons(patients, consultations) {
  const allEncounters = [
    ...patients.map(p => ({ ...p, type: 'patient', encounterDate: p.admissionDate })),
    ...consultations.map(c => ({ ...c, type: 'consultation', encounterDate: c.consultationDate }))
  ].sort((a, b) => {
    const dateA = a.encounterDate ? new Date(a.encounterDate).getTime() : 0;
    const dateB = b.encounterDate ? new Date(b.encounterDate).getTime() : 0;
    return dateA - dateB;
  });

  const personsMap = new Map();

  for (const rec of allEncounters) {
    const pId = rec.personId || rec.id;
    if (!personsMap.has(pId)) {
      personsMap.set(pId, {
        personId: pId,
        hospitalizationsCount: 0,
        consultationsCount: 0,
      });
    }
    
    const p = personsMap.get(pId);
    if (rec.type === 'patient') p.hospitalizationsCount++;
    if (rec.type === 'consultation') p.consultationsCount++;
    
    p.fullName = rec.fullName || p.fullName;
    p.birthDate = rec.birthDate || p.birthDate;
    p.tokenNumber = rec.tokenNumber || p.tokenNumber;
    p.rank = rec.rank || p.rank;
    p.militaryUnit = rec.militaryUnit || p.militaryUnit;
    p.militaryStatus = rec.militaryStatus || p.militaryStatus;
    if (rec.isSvoParticipant !== undefined && rec.isSvoParticipant !== null) p.isSvoParticipant = rec.isSvoParticipant;
    
    p.address = rec.address || p.address;
    p.phoneNumber = rec.phoneNumber || p.phoneNumber;
    p.relativeRelation = rec.relativeRelation || p.relativeRelation;
    p.relativeFullName = rec.relativeFullName || p.relativeFullName;
    p.relativePhone = rec.relativePhone || p.relativePhone;
    p.relativeAddress = rec.relativeAddress || p.relativeAddress;
    
    if (rec.encounterDate) p.latestEncounterDate = rec.encounterDate;
  }

  const personsList = Array.from(personsMap.values()).map(p => {
    const isOtherRank = ['Пенсионер МО РФ', 'Член семьи военнослужащего', 'Другие'].includes(p.rank);
    if (isOtherRank) {
      p.militaryStatus = null;
      p.isSvoParticipant = false;
    }
    return p;
  }).sort((a, b) => {
    if (!a.latestEncounterDate) return 1;
    if (!b.latestEncounterDate) return -1;
    return b.latestEncounterDate - a.latestEncounterDate;
  });
  
  return personsList;
}

module.exports = { aggregatePersons };

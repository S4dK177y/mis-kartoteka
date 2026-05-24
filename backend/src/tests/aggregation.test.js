const { aggregatePersons } = require('../utils/aggregation');

describe('aggregatePersons', () => {
  it('should correctly aggregate patient and consultation data into a single person profile', () => {
    const patients = [
      {
        id: 'p1',
        personId: 'person1',
        fullName: 'Иванов Иван',
        admissionDate: new Date('2023-01-01T10:00:00Z'),
        rank: 'Рядовой',
        militaryStatus: 'По призыву',
        isSvoParticipant: false
      }
    ];
    const consultations = [
      {
        id: 'c1',
        personId: 'person1',
        consultationDate: new Date('2023-02-01T10:00:00Z'),
        rank: 'Ефрейтор'
        // Notice militaryStatus and isSvoParticipant are not provided here
      }
    ];

    const result = aggregatePersons(patients, consultations);

    expect(result).toHaveLength(1);
    expect(result[0].personId).toBe('person1');
    expect(result[0].fullName).toBe('Иванов Иван');
    
    // The rank should be updated to the latest encounter (consultation)
    expect(result[0].rank).toBe('Ефрейтор');
    
    // militaryStatus should carry over from the older record
    expect(result[0].militaryStatus).toBe('По призыву');
  });

  it('should wipe militaryStatus and isSvoParticipant if the final rank is Other (e.g. Пенсионер МО РФ)', () => {
    const patients = [
      {
        id: 'p1',
        personId: 'person2',
        fullName: 'Петров Петр',
        admissionDate: new Date('2023-01-01T10:00:00Z'),
        rank: 'Майор',
        militaryStatus: 'По контракту',
        isSvoParticipant: true
      }
    ];
    const consultations = [
      {
        id: 'c1',
        personId: 'person2',
        consultationDate: new Date('2025-01-01T10:00:00Z'),
        rank: 'Пенсионер МО РФ' // Status changed!
      }
    ];

    const result = aggregatePersons(patients, consultations);

    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe('Пенсионер МО РФ');
    
    // These must be wiped out because of the final rank
    expect(result[0].militaryStatus).toBeNull();
    expect(result[0].isSvoParticipant).toBe(false);
  });
});

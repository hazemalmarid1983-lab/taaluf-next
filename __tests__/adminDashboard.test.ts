import { buildAdminViews } from '../lib/adminDashboard';

const users = [
  {
    id: 'p1',
    email: 'parent@taaluf.local',
    name: 'ولي أمر',
    role: 'parent',
  },
  {
    id: 's1',
    email: 'specialist@taaluf.local',
    name: 'أخصائي تآلف',
    role: 'specialist',
  },
];

describe('buildAdminViews', () => {
  it('groups parent children and specialist caseload with results', () => {
    const views = buildAdminViews({
      users,
      students: [
        {
          id: 'c1',
          name: 'أحمد',
          age: 6,
          parentEmail: 'parent@taaluf.local',
          createdAt: '2026-01-01',
          source: 'parent',
        },
        {
          id: 'c2',
          name: 'سارة',
          age: 8,
          specialistEmail: 'specialist@taaluf.local',
          createdAt: '2026-01-02',
          source: 'specialist',
        },
      ],
      assessments: [
        {
          id: 'a1',
          studentId: 'c2',
          studentName: 'سارة',
          percentage: 40,
          classification: 'متوسط',
          totalScore: 20,
          maxScore: 108,
          savedAt: '2026-01-03',
          byEmail: 'specialist@taaluf.local',
        },
      ],
      bookings: [],
      payments: [],
      local: {
        students: [],
        assessments: [],
        goals: [{ childId: 'c2', status: 'active' }],
        screeningChildId: 'c1',
        parentQChildIds: [],
      },
    });

    expect(views.parents[0].children[0].name).toBe('أحمد');
    expect(views.parents[0].children[0].hasScreening).toBe(true);
    expect(views.specialists[0].cases[0].name).toBe('سارة');
    expect(views.specialists[0].assessmentsDone).toBe(1);
    expect(views.specialists[0].avgPercentage).toBe(40);
    expect(views.progress.assessedCount).toBe(1);
    expect(views.progress.goalsActive).toBe(1);
  });
});

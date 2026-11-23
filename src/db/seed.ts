import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import {
  users,
  healthLogs,
  meals,
  preMealLogs,
  postMealLogs,
  symptoms,
  sleepLogs,
  activityLogs,
  hydrationLogs,
  foodDatabase,
  educationArticles,
  categories,
  notifications,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@medikacheck.id'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Database already seeded, skipping seed.');
      return;
    }

    console.log('Seeding initial MedikaCheck data...');

    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin123!', adminSalt);

    const userSalt = await bcrypt.genSalt(10);
    const userPasswordHash = await bcrypt.hash('User123!', userSalt);

    // 1. Create Admin
    const [adminUser] = await db
      .insert(users)
      .values({
        uid: 'admin-medikacheck-uid',
        email: 'admin@medikacheck.id',
        passwordHash: adminPasswordHash,
        name: 'Administrator MedikaCheck',
        role: 'ADMIN',
        isActive: true,
      })
      .returning();

    // 2. Create Demo User
    const [demoUser] = await db
      .insert(users)
      .values({
        uid: 'user-ahmad-uid',
        email: 'user@medikacheck.id',
        passwordHash: userPasswordHash,
        name: 'Ahmad Pratama',
        role: 'USER',
        isActive: true,
      })
      .returning();

    // Helper for dates
    const today = new Date();
    const getDateStr = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return d.toISOString().split('T')[0];
    };

    // 3. Seed Categories
    await db.insert(categories).values([
      { name: 'Sarapan', type: 'MEAL', description: 'Menu makan pagi untuk energi awal hari' },
      { name: 'Makan Siang', type: 'MEAL', description: 'Menu makan utama tengah hari' },
      { name: 'Makan Malam', type: 'MEAL', description: 'Menu makan malam santai' },
      { name: 'Snack / Camilan', type: 'MEAL', description: 'Camilan sehat antar waktu makan' },
      { name: 'Pencernaan', type: 'SYMPTOM', description: 'Gejala berkaitan dengan perut dan usus' },
      { name: 'Kardio & Stamina', type: 'ACTIVITY', description: 'Aktivitas penguat jantung dan pernapasan' },
      { name: 'Gaya Hidup & Nutrisi', type: 'ARTICLE', description: 'Edukasi pola hidup dan gizi seimbang' },
    ]);

    // 4. Seed Food Database
    await db.insert(foodDatabase).values([
      {
        name: 'Oatmeal Pisang & Madu',
        category: 'Sarapan',
        calories: 250,
        protein: 7,
        carbs: 45,
        fat: 4,
        standardPortion: '1 Mangkuk (200g)',
        description: 'Tinggi serat larut beta-glukan, ramah lambung dan membantu kestabilan energi.',
      },
      {
        name: 'Nasi Merah Ayam Panggang & Sayur Bayam',
        category: 'Makan Siang',
        calories: 420,
        protein: 32,
        carbs: 52,
        fat: 8,
        standardPortion: '1 Piring Saji',
        description: 'Menu seimbang dengan protein tanpa lemak dan zat besi tinggi.',
      },
      {
        name: 'Sup Ikan Kuah Bening & Tahu Tempe',
        category: 'Makan Malam',
        calories: 310,
        protein: 28,
        carbs: 22,
        fat: 6,
        standardPortion: '1 Mangkuk Besar',
        description: 'Ringan di lambung saat malam hari dengan kaldu kaya mineral.',
      },
      {
        name: 'Greek Yogurt & Buah Beri',
        category: 'Snack / Camilan',
        calories: 140,
        protein: 12,
        carbs: 18,
        fat: 2,
        standardPortion: '1 Cup (150g)',
        description: 'Kaya probiotik alami yang mendukung kesehatan mikrobioma usus.',
      },
      {
        name: 'Nasi Goreng Telur Spesial',
        category: 'Makan Malam',
        calories: 520,
        protein: 16,
        carbs: 68,
        fat: 19,
        standardPortion: '1 Porsi',
        description: 'Menu favorit berkarbohidrat tinggi; perhatikan porsi minyak.',
      },
    ]);

    // 5. Seed Education Articles
    await db.insert(educationArticles).values([
      {
        title: '5 Cara Menjaga Keseimbangan Lambung Saat Beraktivitas Padat',
        category: 'Gaya Hidup & Nutrisi',
        summary: 'Pahami pola makan teratur dan jenis makanan yang memicu peradangan lambung.',
        content: `Kesehatan sistem pencernaan sangat dipengaruhi oleh ritme sirkadian dan kestabilan hormon stres.
Berikut 5 prinsip utama:
1. Makan dengan porsi sedang pada jam yang teratur untuk menghindari lonjakan asam lambung.
2. Kunyah makanan setidaknya 20-30 kali per suapan untuk meringankan kerja enzim lambung.
3. Hindari langsung berbaring dalam kurun waktu 2 jam setelah makan.
4. Perbanyak konsumsi serat alami dari sayuran matang dan buah tidak asam.
5. Cukupi asupan cairan harian secara bertahap sepanjang hari.`,
        author: 'dr. Sarah Nurdiana, Sp.GK',
        readTime: '4 min read',
        isPublished: true,
      },
      {
        title: 'Pengaruh Kualitas Tidur terhadap Tingkat Energi dan Mood Harian',
        category: 'Gaya Hidup & Nutrisi',
        summary: 'Tidur nyenyak 7-8 jam meregenerasi sel syaraf dan menyeimbangkan hormon kortisol.',
        content: `Kurang tidur secara kronis dapat menyebabkan resistensi insulin dan meningkatkan hormon ghrelin (pemicu rasa lapar berlebih).
Menjaga sleep hygiene seperti mematikan layar gadget 30 menit sebelum tidur terbukti meningkatkan durasi deep sleep hingga 25%.`,
        author: 'dr. Budi Setiawan, Sp.KJ',
        readTime: '3 min read',
        isPublished: true,
      },
    ]);

    // 6. Seed Notifications
    await db.insert(notifications).values([
      {
        title: 'Selamat Datang di MedikaCheck!',
        message: 'Mulai pantau kesehatan, nutrisi, dan kualitas hidup Anda setiap hari secara terstruktur.',
        targetRole: 'ALL',
        type: 'INFO',
        isActive: true,
      },
      {
        title: 'Tips Hari Ini: Jaga Hidrasi Anda',
        message: 'Minum minimal 2000 ml air putih sehari untuk menjaga fokus mental dan fungsi pencernaan.',
        targetRole: 'USER',
        type: 'TIP',
        isActive: true,
      },
    ]);

    // 7. Seed Health Logs for Demo User (Ahmad) across past 7 days
    const healthData = [
      { offset: 6, time: '08:00', energy: 8, mood: 'Baik', body: 'Segar', stomach: 'Nyaman', stress: 3, notes: 'Bangun pagi merasa bugar.' },
      { offset: 5, time: '08:15', energy: 7, mood: 'Baik', body: 'Segar', stomach: 'Nyaman', stress: 4, notes: 'Siap bekerja.' },
      { offset: 4, time: '08:30', energy: 6, mood: 'Netral', body: 'Sedikit Lemas', stomach: 'Begah', stress: 6, notes: 'Banyak deadline kantor.' },
      { offset: 3, time: '08:10', energy: 5, mood: 'Cemas', body: 'Pegal Leher', stomach: 'Perih', stress: 7, notes: 'Terlambat sarapan, asam lambung agak naik.' },
      { offset: 2, time: '08:00', energy: 8, mood: 'Sangat Baik', body: 'Segar', stomach: 'Nyaman', stress: 2, notes: 'Istirahat akhir pekan sangat membantu.' },
      { offset: 1, time: '08:30', energy: 7, mood: 'Baik', body: 'Segar', stomach: 'Nyaman', stress: 4, notes: 'Pola makan kembali teratur.' },
      { offset: 0, time: '08:00', energy: 9, mood: 'Sangat Baik', body: 'Sangat Segar', stomach: 'Nyaman', stress: 2, notes: 'Kondisi tubuh prima hari ini.' },
    ];

    for (const h of healthData) {
      await db.insert(healthLogs).values({
        userId: demoUser.id,
        date: getDateStr(h.offset),
        time: h.time,
        energy: h.energy,
        mood: h.mood,
        bodyCondition: h.body,
        stomachCondition: h.stomach,
        stressLevel: h.stress,
        notes: h.notes,
      });
    }

    // 8. Seed Meals + Pre-Meal & Post-Meal Logs for Demo User
    const mealsSeed = [
      {
        offset: 2,
        name: 'Oatmeal Pisang & Madu',
        category: 'Sarapan',
        portion: 'Sedang (1 Mangkuk)',
        time: '07:30',
        notes: 'Sarapan sehat hangat sebelum kerja',
        pre: { hunger: 7, energy: 6, mood: 'Baik', stomach: 'Sedikit Lapar', body: 'Segar', notes: 'Perut kosong nyaman' },
        post: { energy: 8, mood: 'Sangat Baik', fullness: 7, stomach: 'Nyaman', sleepy: false, nauseous: false, bloated: false, discomfort: 0, notes: 'Energi meningkat cepat dan tidak kembung' },
      },
      {
        offset: 2,
        name: 'Nasi Merah Dada Ayam & Sayur Bening',
        category: 'Makan Siang',
        portion: 'Sedang (1 Piring)',
        time: '12:30',
        notes: 'Makan siang kantin sehat',
        pre: { hunger: 8, energy: 6, mood: 'Netral', stomach: 'Lapar', body: 'Lelah Kerja', notes: 'Fokus mulai menurun' },
        post: { energy: 8, mood: 'Baik', fullness: 8, stomach: 'Nyaman', sleepy: false, nauseous: false, bloated: false, discomfort: 0, notes: 'Kenyang pas, energi pulih' },
      },
      {
        offset: 1,
        name: 'Nasi Goreng Pedas & Kerupuk',
        category: 'Makan Malam',
        portion: 'Besar (1 Porsi Penuh)',
        time: '19:45',
        notes: 'Makan di luar bersama teman',
        pre: { hunger: 9, energy: 5, mood: 'Lelah', stomach: 'Sangat Lapar', body: 'Pegal', notes: 'Sangat kelaparan setelah lembur' },
        post: { energy: 4, mood: 'Buruk', fullness: 9, stomach: 'Begah & Perih', sleepy: true, nauseous: true, bloated: true, discomfort: 7, notes: 'Rasa pedas membuat perut tidak nyaman dan mengantuk berat' },
      },
      {
        offset: 0,
        name: 'Roti Gandum Telur Rebus & Alpukat',
        category: 'Sarapan',
        portion: 'Sedang (2 Lembar)',
        time: '07:45',
        notes: 'Kaya lemak baik dan protein',
        pre: { hunger: 6, energy: 7, mood: 'Baik', stomach: 'Normal', body: 'Segar', notes: 'Pagi cerah' },
        post: { energy: 9, mood: 'Sangat Baik', fullness: 7, stomach: 'Sangat Nyaman', sleepy: false, nauseous: false, bloated: false, discomfort: 0, notes: 'Sangat puas dan berenergi' },
      },
    ];

    for (const m of mealsSeed) {
      const dateStr = getDateStr(m.offset);
      const [insertedMeal] = await db
        .insert(meals)
        .values({
          userId: demoUser.id,
          name: m.name,
          category: m.category,
          portion: m.portion,
          date: dateStr,
          time: m.time,
          notes: m.notes,
        })
        .returning();

      // Pre-meal
      await db.insert(preMealLogs).values({
        userId: demoUser.id,
        mealId: insertedMeal.id,
        date: dateStr,
        time: m.time,
        hungerLevel: m.pre.hunger,
        energy: m.pre.energy,
        mood: m.pre.mood,
        stomachCondition: m.pre.stomach,
        bodyCondition: m.pre.body,
        notes: m.pre.notes,
      });

      // Post-meal
      await db.insert(postMealLogs).values({
        userId: demoUser.id,
        mealId: insertedMeal.id,
        date: dateStr,
        time: '13:30',
        energy: m.post.energy,
        mood: m.post.mood,
        fullnessLevel: m.post.fullness,
        stomachCondition: m.post.stomach,
        isSleepy: m.post.sleepy,
        isNauseous: m.post.nauseous,
        isBloated: m.post.bloated,
        discomfortLevel: m.post.discomfort,
        notes: m.post.notes,
      });
    }

    // 9. Seed Symptoms
    await db.insert(symptoms).values([
      {
        userId: demoUser.id,
        name: 'Perut Kembung & Begah',
        intensity: 6,
        date: getDateStr(1),
        time: '20:30',
        duration: '1 Jam 30 Menit',
        notes: 'Terjadi setelah konsumsi nasi goreng pedas minyak berlebih.',
      },
      {
        userId: demoUser.id,
        name: 'Sakit Kepala Tegang',
        intensity: 4,
        date: getDateStr(3),
        time: '16:00',
        duration: '45 Menit',
        notes: 'Stres menatap layar komputer saat lembur.',
      },
    ]);

    // 10. Seed Sleep Logs
    const sleepData = [
      { offset: 6, sleep: '23:00', wake: '06:30', duration: 7.5, quality: 4, notes: 'Tidur nyenyak tanpa terbangun.' },
      { offset: 5, sleep: '23:30', wake: '06:30', duration: 7.0, quality: 4, notes: 'Cukup segar di pagi hari.' },
      { offset: 4, sleep: '00:30', wake: '06:00', duration: 5.5, quality: 2, notes: 'Tidur larut karena pekerjaan, bangun agak lelah.' },
      { offset: 3, sleep: '00:00', wake: '06:15', duration: 6.25, quality: 3, notes: 'Terbangun sekali di tengah malam.' },
      { offset: 2, sleep: '22:45', wake: '07:00', duration: 8.25, quality: 5, notes: 'Sangat pulas di akhir pekan.' },
      { offset: 1, sleep: '23:15', wake: '06:45', duration: 7.5, quality: 4, notes: 'Istirahat optimal.' },
      { offset: 0, sleep: '22:30', wake: '06:30', duration: 8.0, quality: 5, notes: 'Bangun dengan segar bugar.' },
    ];

    for (const s of sleepData) {
      await db.insert(sleepLogs).values({
        userId: demoUser.id,
        date: getDateStr(s.offset),
        sleepTime: s.sleep,
        wakeTime: s.wake,
        durationHours: s.duration,
        quality: s.quality,
        notes: s.notes,
      });
    }

    // 11. Seed Activity Logs
    const activityData = [
      { offset: 5, name: 'Jalan Santai Pagi', duration: 30, intensity: 'Rendah', time: '06:45', notes: 'Keliling komplek rumah.' },
      { offset: 4, name: 'Stretching & Yoga Ringan', duration: 20, intensity: 'Rendah', time: '17:30', notes: 'Melemaskan otot bahu.' },
      { offset: 2, name: 'Jogging Outdoor', duration: 40, intensity: 'Sedang', time: '07:00', notes: 'Menempuh jarak 4.5 km.' },
      { offset: 1, name: 'Latihan Beban (Gym)', duration: 45, intensity: 'Tinggi', time: '17:00', notes: 'Fokus otot punggung dan lengan.' },
      { offset: 0, name: 'Bersepeda Santai', duration: 35, intensity: 'Sedang', time: '06:45', notes: 'Menikmati udara pagi.' },
    ];

    for (const a of activityData) {
      await db.insert(activityLogs).values({
        userId: demoUser.id,
        activityName: a.name,
        durationMinutes: a.duration,
        intensity: a.intensity,
        date: getDateStr(a.offset),
        time: a.time,
        notes: a.notes,
      });
    }

    // 12. Seed Hydration Logs
    const hydrationData = [
      { offset: 1, amount: 600, time: '07:30', notes: '2 gelas setelah bangun pagi' },
      { offset: 1, amount: 800, time: '12:00', notes: 'Botol minum siang' },
      { offset: 1, amount: 750, time: '16:00', notes: 'Sore saat kerja' },
      { offset: 0, amount: 500, time: '07:00', notes: 'Segelas air hangat + lemon' },
      { offset: 0, amount: 800, time: '11:30', notes: 'Air mineral kantor' },
      { offset: 0, amount: 600, time: '15:00', notes: 'Hidrasi sore' },
      { offset: 0, amount: 400, time: '18:30', notes: 'Menjelang makan malam' },
    ];

    for (const hy of hydrationData) {
      await db.insert(hydrationLogs).values({
        userId: demoUser.id,
        amountMl: hy.amount,
        date: getDateStr(hy.offset),
        time: hy.time,
        notes: hy.notes,
      });
    }

    console.log('MedikaCheck database seeded successfully!');
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}

export function computePublicHealthCheck(data: {
  energy?: number;
  mood?: string;
  bodyCondition?: string;
  stomachCondition?: string;
  stressLevel?: number;
}) {
  const { energy = 7, mood = 'Netral', bodyCondition = 'Normal', stomachCondition = 'Normal', stressLevel = 3 } = data;
  const energyScore = (Number(energy) || 5) * 4;
  const stressScore = Math.max(0, 10 - (Number(stressLevel) || 5)) * 3;

  let stomachScore = 30;
  const stom = (stomachCondition || '').toLowerCase();
  if (stom.includes('perih')) stomachScore = 5;
  else if (stom.includes('mual') || stom.includes('kembung')) stomachScore = 12;
  else if (stom.includes('begah')) stomachScore = 20;

  const totalScore = Math.min(100, Math.max(20, Math.round(energyScore + stressScore + stomachScore)));

  let status = 'Kondisi Optimal';
  let summaryText = 'Kondisi vital dan pencernaan Anda saat ini dalam rentang yang baik dan seimbang.';
  const recommendations: string[] = [];

  if (totalScore < 50) {
    status = 'Perlu Perhatian Segera';
    summaryText = 'Tubuh Anda menunjukkan sinyal kelelahan atau gangguan kenyamanan lambung yang signifikan.';
    recommendations.push('Hindari konsumsi makanan pedas, asam, atau berkafein tinggi hari ini.');
    recommendations.push('Beristirahatlah sejenak dan lakukan teknik pernapasan relaksasi 4-7-8 untuk menurunkan kortisol.');
    recommendations.push('Jika perih lambung berlanjut lebih dari 2 hari, segera konsultasikan dengan dokter umum atau spesialis penyakit dalam.');
  } else if (totalScore < 75) {
    status = 'Kondisi Cukup Sehat';
    summaryText = 'Ada sedikit indikasi kelelahan fisik atau stres ringan yang mempengaruhi pencernaan Anda.';
    recommendations.push('Minum air putih hangat bertahap minimal 1.5 - 2 liter hari ini.');
    recommendations.push('Makan tepat waktu dengan porsi sedang untuk mencegah asam lambung naik.');
    recommendations.push('Lakukan peregangan otot ringan selama 10-15 menit untuk melancarkan sirkulasi.');
  } else {
    recommendations.push('Pertahankan hidrasi dan kualitas tidur nyak 7-8 jam per malam.');
    recommendations.push('Kombinasikan serat sayur dan protein tanpa lemak pada jadwal makan berikutnya.');
    recommendations.push('Kondisi tubuh sangat prima untuk beraktivitas produktif hari ini.');
  }

  return {
    score: totalScore,
    status,
    summaryText,
    analysis: {
      energyLevel: `${energy}/10`,
      stressLevel: `${stressLevel}/10`,
      stomachCondition: stomachCondition || 'Normal',
      bodyCondition: bodyCondition || 'Normal',
      mood: mood || 'Netral',
    },
    recommendations,
    disclaimer:
      'Data ini berasal dari pemeriksaan mandiri berbasis kuesioner pengguna dan bukan merupakan diagnosis medis formal.',
  };
}

export function computePublicMentalHealthCheck(data: {
  feelingScore?: number;
  anxietyLevel?: number;
  overthinkingFrequency?: string;
  sleepCalmness?: string;
  dailyEnthusiasm?: string;
  physicalStress?: string[];
  supportSystem?: string;
}) {
  const {
    feelingScore = 3,
    anxietyLevel = 3,
    overthinkingFrequency = 'Kadang-kadang',
    sleepCalmness = 'Cukup Nyenyak',
    dailyEnthusiasm = 'Cukup Bersemangat',
    physicalStress = [],
    supportSystem = 'Ada Keluarga/Sahabat yang Mendukung',
  } = data;

  const fScore = (Number(feelingScore) / 5) * 25;
  const anxietyReverse = Math.max(1, 6 - Number(anxietyLevel));
  const aScore = (anxietyReverse / 5) * 25;

  let otScore = 15;
  if (overthinkingFrequency === 'Jarang') otScore = 15;
  else if (overthinkingFrequency === 'Kadang-kadang') otScore = 11;
  else if (overthinkingFrequency === 'Sering') otScore = 6;
  else if (overthinkingFrequency === 'Hampir Setiap Saat') otScore = 2;

  let sleepScore = 15;
  if (sleepCalmness === 'Sangat Nyenyak & Tenang') sleepScore = 15;
  else if (sleepCalmness === 'Cukup Nyenyak') sleepScore = 11;
  else if (sleepCalmness === 'Sering Terbangun/Gelisah') sleepScore = 6;
  else sleepScore = 2;

  let enthusScore = 10;
  if (dailyEnthusiasm === 'Penuh Semangat') enthusScore = 10;
  else if (dailyEnthusiasm === 'Cukup Bersemangat') enthusScore = 7;
  else if (dailyEnthusiasm === 'Mudah Lelah/Hambar') enthusScore = 4;
  else enthusScore = 1;

  let supportScore = 10;
  if (supportSystem === 'Ada Keluarga/Sahabat yang Mendukung') supportScore = 10;
  else if (supportSystem === 'Ada tetapi Sulit Terbuka') supportScore = 6;
  else supportScore = 2;

  const physCount = Array.isArray(physicalStress)
    ? physicalStress.filter((s) => s !== 'Tidak Ada Gejala' && s !== 'Tidak Ada Keluhan Fisik').length
    : 0;
  const physPenalty = Math.min(15, physCount * 3);

  const totalRaw = fScore + aScore + otScore + sleepScore + enthusScore + supportScore - physPenalty;
  const finalScore = Math.min(100, Math.max(15, Math.round(totalRaw)));

  let statusCategory = 'Kondisi Mental Sangat Baik & Berdaya';
  let statusTone = 'EXCELLENT';
  let stressBadge = 'Tingkat Stres: Rendah & Terkelola';
  let summaryText =
    'Kondisi emosional dan pikiran Anda berada dalam frekuensi yang seimbang, tenang, dan memiliki resiliensi (daya tahan mental) yang sangat baik untuk menghadapi aktivitas harian.';
  const recommendations: string[] = [];
  let warmAffirmation =
    'Terus rawat ketenangan ini dengan meluangkan waktu bersyukur dan menikmati hal-hal kecil setiap hari.';

  if (finalScore < 45) {
    statusCategory = 'Beban Pikiran & Emosional Sedang Menumpuk';
    statusTone = 'CONCERN';
    stressBadge = 'Tingkat Stres: Tinggi / Kelelahan Mental';
    summaryText =
      'Hati dan pikiran Anda saat ini sedang memikul beban yang cukup berat. Ini adalah hal yang wajar dirasakan oleh manusia, dan bukan berarti Anda lemah. Tubuh dan jiwa Anda hanya sedang memberi sinyal bahwa Anda butuh istirahat sejati dan ruang untuk bernapas tanpa dituntut serba sempurna.';
    recommendations.push('Hentikan sejenak tuntutan untuk menyelesaikan segalanya hari ini. Berikan diri Anda izin istirahat minimal 1–2 jam tanpa memikirkan pekerjaan atau masalah.');
    recommendations.push('Lakukan teknik pernapasan lambat (tarik napas lembut 4 detik, tahan 4 detik, hembuskan perlahan 6 detik) sebanyak 5 siklus saat rasa cemas muncul.');
    recommendations.push('Kurangi konsumsi berita yang memicu kecemasan dan batasi penggunaan media sosial sebelum tidur malam.');
    recommendations.push('Cobalah bercerita kepada satu orang yang Anda percayai, atau hubungi konselor / psikolog profesional bila perasaan sesak ini berlanjut.');
    warmAffirmation =
      'Anda sudah berusaha sebaik mungkin sampai hari ini. Beristirahat bukanlah tanda menyerah, melainkan bentuk kasih sayang paling tulus untuk diri sendiri.';
  } else if (finalScore < 70) {
    statusCategory = 'Lelah Mental Ringan (Perlu Jeda & Relaksasi)';
    statusTone = 'MILD';
    stressBadge = 'Tingkat Stres: Sedang (Fluktuasi Wajar)';
    summaryText =
      'Ada beberapa hal yang mengganjal atau membuat pikiran Anda berputar lebih kencang dari biasanya. Keseimbangan Anda masih cukup baik, namun jika dibiarkan tanpa relaksasi, kelelahan ini bisa menguras energi fisik Anda.';
    recommendations.push('Sempatkan berjalan kaki santai di pagi atau sore hari selama 15–20 menit untuk menyegarkan sirkulasi dan hormon endorfin.');
    recommendations.push('Tuliskan apa saja yang Anda khawatirkan di selembar kertas, lalu pilih hanya 1 hal yang benar-benar bisa Anda kendalikan hari ini.');
    recommendations.push('Jaga jam tidur agar teratur dan nikmati minuman hangat seperti teh chamomile atau susu hangat di malam hari.');
    recommendations.push('Sediakan waktu untuk hobi ringan yang menyenangkan hati tanpa target hasil.');
    warmAffirmation =
      'Setiap hari adalah proses bertumbuh. Tidak apa-apa jika hari ini Anda hanya melangkah pelan, yang terpenting Anda tetap melangkah.';
  } else {
    recommendations.push('Pertahankan rutinitas istirahat dan pola makan bergizi yang menopang hormon kebahagiaan.');
    recommendations.push('Bagikan energi positif dan dengarkan orang-orang terdekat yang mungkin sedang membutuhkan dukungan Anda.');
    recommendations.push('Luangkan 10 menit setiap pagi untuk hening, berdoa, atau bermeditasi agar fokus batin tetap jernih.');
    recommendations.push('Tetap jadwalkan waktu istirahat dan jangan memaksakan diri bekerja berlebihan meski tubuh terasa bersemangat.');
  }

  return {
    score: finalScore,
    category: statusCategory,
    tone: statusTone,
    stressBadge,
    summary: summaryText,
    recommendations,
    affirmation: warmAffirmation,
    details: {
      feelingScore: `${feelingScore}/5`,
      anxietyLevel: `${anxietyLevel}/5`,
      overthinkingFrequency,
      sleepCalmness,
      dailyEnthusiasm,
      supportSystem,
      physicalSymptomsCount: physCount,
    },
    disclaimer:
      'Pemeriksaan mental mandiri ini bertujuan untuk refleksi kesejahteraan emosional dan perawatan diri (self-care). Jika Anda merasakan kesedihan mendalam yang berkepanjangan, jangan ragu untuk berkonsultasi langsung dengan psikolog, psikiater, atau hotline Sejiwa Kemenkes (119 ext 8).',
  };
}

export function computePublicFoodEffect(data: {
  foodName: string;
  portion?: string;
}) {
  const { foodName, portion } = data;
  const query = foodName.toLowerCase().trim();

  const isSpicy = query.includes('pedas') || query.includes('sambal') || query.includes('geprek') || query.includes('balado') || query.includes('rica');
  const isFriedOrFatty = query.includes('goreng') || query.includes('rendang') || query.includes('santan') || query.includes('gulai') || query.includes('lemak') || query.includes('crispy') || query.includes('mentega');
  const isHighCarb = query.includes('mie') || query.includes('nasi') || query.includes('roti') || query.includes('pasta') || query.includes('bakso') || query.includes('donat');
  const isSweet = query.includes('manis') || query.includes('boba') || query.includes('kue') || query.includes('es ') || query.includes('sirup') || query.includes('cokelat');
  const isHealthyFiber = query.includes('oat') || query.includes('sayur') || query.includes('salad') || query.includes('buah') || query.includes('bayam') || query.includes('ikan');
  const isCoffee = query.includes('kopi') || query.includes('espresso') || query.includes('caffeine');

  let digestionTime = '2 - 3 Jam';
  let stomachImpact = 'Kategori Ramah Lambung';
  let stomachImpactType: 'SAFE' | 'WARNING' | 'ALERT' = 'SAFE';
  let glycemicImpact = 'Sedang';
  let expectedEnergyCurve = 'Kestabilan energi terjaga 3-4 jam.';
  const effects: string[] = [];
  const healthAdvice: string[] = [];

  if (isFriedOrFatty && isSpicy) {
    stomachImpact = 'Beban Lambung Berat & Potensi Iritasi Asam Lambung';
    stomachImpactType = 'ALERT';
    digestionTime = '4 - 5 Jam';
    glycemicImpact = 'Tinggi & Lambat Dicerna';
    expectedEnergyCurve = 'Kenyang sangat padat, potensi lemas/kantuk berat dalam 45 menit ke depan.';
    effects.push('Kandungan kapsaisin dan lemak memperlambat pengosongan lambung (delayed gastric emptying).');
    effects.push('Risiko sensasi panas di ulu hati (heartburn) atau perut begah kembung.');
    effects.push('Pergeseran sirkulasi darah ke saluran pencernaan memicu rasa mengantuk.');
    healthAdvice.push('Dilarang langsung berbaring atau tidur setidaknya selama 2-3 jam setelah makan.');
    healthAdvice.push('Minum air putih hangat sedikit demi sedikit; hindari air es atau soda.');
    healthAdvice.push('Jalan santai ringan 10-15 menit untuk membantu motilitas saluran cerna.');
  } else if (isFriedOrFatty) {
    stomachImpact = 'Tinggi Lemak / Perlu Waktu Cerna Lebih Panjang';
    stomachImpactType = 'WARNING';
    digestionTime = '3.5 - 4.5 Jam';
    expectedEnergyCurve = 'Rasa kenyang bertahan lama namun rentan memicu kembung jika porsi besar.';
    effects.push('Tingginya asam lemak memerlukan pelepasan enzim lipase dan empedu ekstra.');
    effects.push('Pemberian sinyal hormon kenyang yang memicu rasa rileks.');
    healthAdvice.push('Batasi camilan manis tambahan agar tidak memperberat kerja pencernaan.');
    healthAdvice.push('Hindari pakaian dengan ikat pinggang yang terlalu menekan perut.');
  } else if (isSpicy) {
    stomachImpact = 'Sensasi Hangat & Peningkatan Produksi Asam Lambung';
    stomachImpactType = 'WARNING';
    digestionTime = '2.5 - 3.5 Jam';
    effects.push('Merangsang sekresi asam hidroklorida (HCl) di dinding mukosa lambung.');
    effects.push('Meningkatkan laju metabolisme basal sementara.');
    healthAdvice.push('Jika perut terasa agak perih, konsumsi segelas air hangat atau susu oat/kedelai.');
  } else if (isHighCarb || isSweet) {
    stomachImpact = 'Pencernaan Cepat dengan Lonjakan Glukosa';
    stomachImpactType = 'WARNING';
    digestionTime = '2 - 3 Jam';
    glycemicImpact = 'Tinggi';
    expectedEnergyCurve = 'Lonjakan energi cepat di 30 menit awal, diikuti penurunan dan rasa kantuk.';
    effects.push('Lonjakan glukosa darah menstimulasi pelepasan hormon insulin dalam jumlah besar.');
    effects.push('Memicu produksi serotonin dan melatonin yang memberi efek mengantuk.');
    healthAdvice.push('Lakukan peregangan otot atau jalan kaki singkat untuk menstabilkan gula darah.');
    healthAdvice.push('Sediakan air putih untuk menjaga hidrasi tubuh.');
  } else if (isHealthyFiber) {
    stomachImpact = 'Sangat Ramah Mukosa Lambung & Usus';
    stomachImpactType = 'SAFE';
    digestionTime = '2 - 3 Jam';
    glycemicImpact = 'Rendah - Seimbang';
    expectedEnergyCurve = 'Energi stabil, fokus mental tajam tanpa rasa kantuk berat.';
    effects.push('Serat larut difermentasi bakteri baik usus untuk menjaga perlindungan dinding pencernaan.');
    effects.push('Pengosongan lambung berjalan harmonis tanpa lonjakan asam berlebih.');
    healthAdvice.push('Pertahankan asupan cairan harian 2 liter agar serat bekerja optimal.');
  } else {
    effects.push('Makanan diproses secara bertahap oleh enzim lambung pepsin dan amilase.');
    effects.push('Kadar glukosa dan asam amino meningkat bertahap dalam sirkulasi darah.');
    healthAdvice.push('Konsumsi air putih secukupnya setelah makan dan hindari aktivitas fisik sangat berat.');
  }

  if (isCoffee) {
    effects.push('Kandungan kafein menstimulasi sistem saraf pusat dan memengaruhi katup lambung.');
    healthAdvice.push('Sebaiknya hindari minum kopi dalam kondisi perut kosong total.');
  }

  return {
    foodName,
    portion: portion || '1 Porsi Standar',
    databaseMatch: null,
    digestionTime,
    stomachImpact,
    stomachImpactType,
    glycemicImpact,
    expectedEnergyCurve,
    effects,
    healthAdvice,
    disclaimer:
      'Keterangan efek fisiologis ini diolah secara prediktif berdasarkan profil nutrisi umum dan bukan diagnosis medis individual.',
  };
}

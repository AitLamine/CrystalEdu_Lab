export const CS = 4.0 // base cell size in world units (match old HTML)

export const STRUCTS = {
  sc: {
    name:'Simple Cubic', label:'SC (cP)', color:0x4fc3f7,
    atoms:[
      {f:[0,0,0]},{f:[1,0,0]},{f:[0,1,0]},{f:[0,0,1]},
      {f:[1,1,0]},{f:[1,0,1]},{f:[0,1,1]},{f:[1,1,1]}
    ],
    bondRule:'sc',
    z:1, cn:6, apf:'52.4%', param:'a — all equal, 90°',
    examples:'Polonium (α-Po)',
    system:'sysCP',
    note:'Only metal stable as SC at room temp: Po.'
  },
  bcc: {
    name:'BCC', label:'cI', color:0x42a5f5,
    atoms:[
      {f:[0,0,0]},{f:[1,0,0]},{f:[0,1,0]},{f:[0,0,1]},
      {f:[1,1,0]},{f:[1,0,1]},{f:[0,1,1]},{f:[1,1,1]},
      {f:[0.5,0.5,0.5]}
    ],
    atoms_prim:[{f:[0,0,0]}],
    lv_prim:[
      [-CS/2, CS/2,  CS/2],
      [ CS/2,-CS/2,  CS/2],
      [ CS/2, CS/2, -CS/2]
    ],
    bondRule:'bcc',
    z:2, cn:8, apf:'68.0%', param:'a — cube edge',
    examples:'Fe, Cr, W, Mo, V, Nb, Ta, Li, Na, K',
    system:'sysCI',
    note:'Body diagonal is the close-packed direction ⟨111⟩.'
  },
  fcc: {
    name:'FCC', label:'cF', color:0x26c6da,
    atoms:[
      {f:[0,0,0]},{f:[1,0,0]},{f:[0,1,0]},{f:[0,0,1]},
      {f:[1,1,0]},{f:[1,0,1]},{f:[0,1,1]},{f:[1,1,1]},
      {f:[0.5,0.5,0]},{f:[0.5,0.5,1]},
      {f:[0.5,0,0.5]},{f:[0.5,1,0.5]},
      {f:[0,0.5,0.5]},{f:[1,0.5,0.5]}
    ],
    atoms_prim:[{f:[0,0,0]}],
    lv_prim:[
      [0, CS/2, CS/2],
      [CS/2, 0, CS/2],
      [CS/2, CS/2, 0]
    ],
    bondRule:'fcc',
    z:4, cn:12, apf:'74.0%', param:'a — cube edge',
    examples:'Al, Cu, Ni, Au, Ag, Pb, Pt, Ca',
    system:'sysCF',
    note:'Close-packed planes are {111}. APF = π/(3√2).'
  },
  hcp: {
    name:'HCP', label:'hP2', color:0x66bb6a,
    lv:[
      [CS,     0,          0      ],
      [-CS/2,  CS*0.8660,  0      ],
      [0,      0,          CS*1.633]
    ],
    atoms:[
      {f:[0.0,  0.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.5,  0.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[1.0,  0.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.25, 0.5,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.75, 0.5,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.0,  1.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.5,  1.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[1.0,  1.0,   0.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.1667,0.3333,0.5], r_sf:1.7638, c:0x2e7d32, lb:'B'},
      {f:[0.6667,0.3333,0.5], r_sf:1.7638, c:0x2e7d32, lb:'B'},
      {f:[0.4167,0.8333,0.5], r_sf:1.7638, c:0x2e7d32, lb:'B'},
      {f:[0.0,  0.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.5,  0.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[1.0,  0.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.25, 0.5,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.75, 0.5,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.0,  1.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[0.5,  1.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'},
      {f:[1.0,  1.0,   1.0], r_sf:1.7638, c:0x66bb6a, lb:'A'}
    ],
    bondRule:'metal',
    z:2, cn:12, apf:'74.0%', param:'a=b, c/a=1.633 ideal',
    examples:'Mg, Ti, Zn, Co, Cd, Zr',
    system:'sysHP',
    note:'ABAB stacking. Same APF as FCC but different stacking.'
  },
  cscl: {
    name:'Cesium Chloride', label:'CsCl', color:0xffa726,
    atoms:[
      {f:[0,0,0],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[1,0,0],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[0,1,0],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[0,0,1],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[1,1,0],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[1,0,1],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[0,1,1],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[1,1,1],c:0xffa726,r:1.67,lb:'Cs⁺'},
      {f:[0.5,0.5,0.5],c:0xef5350,r:1.81,lb:'Cl⁻'},
    ],
    bondRule:'ionic',
    z:1, cn:'8 – 8', apf:'72.9%', param:'d(Cs–Cl) = a√3/2',
    rRatio:'r⁺/r⁻ = 0.93  →  0.732–1.000 range',
    examples:'CsCl, CsBr, CsI, TlCl, NH₄Cl (high T)',
    system:'sysCP',
    note:'NOT BCC — two different ions. CN=8 for both.'
  },
  nacl: {
    name:'Sodium Chloride', label:'NaCl', color:0xef5350,
    atoms:[
      {f:[0,0,0],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[1,0,0],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0,1,0],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0,0,1],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[1,1,0],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[1,0,1],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0,1,1],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[1,1,1],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0.5,0.5,0],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0.5,0.5,1],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0.5,0,0.5],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0.5,1,0.5],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0,0.5,0.5],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[1,0.5,0.5],c:0xef5350,r:1.81,lb:'Cl⁻'},
      {f:[0.5,0,0],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0.5,1,0],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0,0.5,0],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[1,0.5,0],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0.5,0,1],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0.5,1,1],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0,0.5,1],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[1,0.5,1],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0,0,0.5],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[0,1,0.5],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[1,1,0.5],c:0x42a5f5,r:1.02,lb:'Na⁺'},
      {f:[1,1,0.5],c:0x42a5f5,r:1.02,lb:'Na⁺'},
    ],
    bondRule:'ionic',
    z:4, cn:'6 – 6', apf:'79.3%', param:'d(Na–Cl) = a/2',
    rRatio:'r⁺/r⁻ = 0.56  →  0.414–0.732 range',
    examples:'NaCl, KCl, MgO, FeO, NiO, LiF',
    system:'sysCF',
    note:'Cl⁻ FCC. Na⁺ in all octahedral voids.'
  },
  zns: {
    name:'Zinc Blende', label:'ZnS', color:0xab47bc,
    atoms:[
      {f:[0,0,0],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[1,0,0],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0,1,0],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0,0,1],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[1,1,0],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[1,0,1],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0,1,1],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[1,1,1],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0.5,0.5,0],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0.5,0.5,1],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0.5,0,0.5],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0.5,1,0.5],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0,0.5,0.5],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[1,0.5,0.5],c:0xffee58,r:1.84,lb:'S²⁻'},
      {f:[0.25,0.25,0.25],c:0xab47bc,r:0.74,lb:'Zn²⁺'},
      {f:[0.75,0.75,0.25],c:0xab47bc,r:0.74,lb:'Zn²⁺'},
      {f:[0.75,0.25,0.75],c:0xab47bc,r:0.74,lb:'Zn²⁺'},
      {f:[0.25,0.75,0.75],c:0xab47bc,r:0.74,lb:'Zn²⁺'}
    ],
    bondRule:'ionic',
    z:4, cn:'4 – 4', apf:'62.3%', param:'d(Zn–S) = a√3/4',
    rRatio:'r⁺/r⁻ = 0.40  →  0.225–0.414 range',
    examples:'ZnS, CuCl, GaAs, InP, CdTe',
    system:'sysCF',
    note:'S²⁻ FCC. Zn²⁺ in 4 of 8 tetrahedral voids.'
  },
  caf2: {
    name:'Fluorite', label:'CaF₂', color:0xffa726,
    atoms:[
      {f:[0,0,0],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[1,0,0],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0,1,0],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0,0,1],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[1,1,0],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[1,0,1],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0,1,1],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[1,1,1],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0.5,0.5,0],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0.5,0.5,1],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0.5,0,0.5],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0.5,1,0.5],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0,0.5,0.5],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[1,0.5,0.5],c:0xffa726,r:1.00,lb:'Ca²⁺'},
      {f:[0.25,0.25,0.25],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.75,0.75,0.25],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.75,0.25,0.75],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.25,0.75,0.75],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.75,0.75,0.75],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.25,0.25,0.75],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.25,0.75,0.25],c:0xef5350,r:1.33,lb:'F⁻'},
      {f:[0.75,0.25,0.25],c:0xef5350,r:1.33,lb:'F⁻'}
    ],
    bondRule:'ionic',
    z:4, cn:'8 (Ca) / 4 (F)', apf:'62.0%', param:'d(Ca–F) = a√3/4',
    rRatio:'r⁺/r⁻ = 0.75  →  0.732–1.000 range',
    examples:'CaF₂, SrF₂, BaF₂, UO₂',
    system:'sysCF',
    note:'Ca²⁺ CN=8. F⁻ CN=4. All tetrahedral sites filled.'
  },
  diamond: {
    name:'Diamond', label:'C (diamond)', color:0x26c6da,
    atoms:[
      {f:[0,0,0],c:0x26c6da,r:0.77,lb:'C'},
      {f:[1,0,0],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0,1,0],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0,0,1],c:0x26c6da,r:0.77,lb:'C'},
      {f:[1,1,0],c:0x26c6da,r:0.77,lb:'C'},
      {f:[1,0,1],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0,1,1],c:0x26c6da,r:0.77,lb:'C'},
      {f:[1,1,1],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0.5,0.5,0],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0.5,0.5,1],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0.5,0,0.5],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0.5,1,0.5],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0,0.5,0.5],c:0x26c6da,r:0.77,lb:'C'},
      {f:[1,0.5,0.5],c:0x26c6da,r:0.77,lb:'C'},
      {f:[0.25,0.25,0.25],c:0x00838f,r:0.77,lb:'C'},
      {f:[0.75,0.75,0.25],c:0x00838f,r:0.77,lb:'C'},
      {f:[0.75,0.25,0.75],c:0x00838f,r:0.77,lb:'C'},
      {f:[0.25,0.75,0.75],c:0x00838f,r:0.77,lb:'C'}
    ],
    bondRule:'diamond',
    z:8, cn:4, apf:'34.0%', param:'d(C–C) = a√3/4 = 1.54 Å',
    examples:'Diamond (C), Si, Ge, α-Sn',
    system:'sysCF',
    note:'Sp³ tetrahedral bonds. Bond angle = 109.47°.'
  },
  // ── Bravais lattices (abbreviated — add more as needed) ──
  tet_p: {
    name:'Tetragonal P', label:'tP', color:0x64b5f6,
    bravais:true, ax:1.0, ay:1.0, az:1.6,
    atoms:[
      {f:[0,0,0],r_sf:1.2},{f:[1,0,0],r_sf:1.2},{f:[0,1,0],r_sf:1.2},{f:[0,0,1],r_sf:1.2},
      {f:[1,1,0],r_sf:1.2},{f:[1,0,1],r_sf:1.2},{f:[0,1,1],r_sf:1.2},{f:[1,1,1],r_sf:1.2}
    ],
    bondRule:'metal',
    z:1, cn:'4–6 (c/a)', apf:'~52%', param:'a=b, c≠a, α=β=γ=90°',
    examples:'Pa (protactinium)',
    system:'sysTP',
    note:'Two equal axes, one unique. a=b≠c.'
  },
  tet_i: {
    name:'Tetragonal I', label:'tI', color:0x64b5f6,
    bravais:true, ax:1.0, ay:1.0, az:1.6,
    atoms:[
      {f:[0,0,0],r_sf:1.2},{f:[1,0,0],r_sf:1.2},{f:[0,1,0],r_sf:1.2},{f:[0,0,1],r_sf:1.2},
      {f:[1,1,0],r_sf:1.2},{f:[1,0,1],r_sf:1.2},{f:[0,1,1],r_sf:1.2},{f:[1,1,1],r_sf:1.2},
      {f:[0.5,0.5,0.5],r_sf:1.2}
    ],
    bondRule:'metal',
    z:2, cn:8, apf:'~68%', param:'a=b, c≠a, α=β=γ=90°',
    examples:'In, β-Sn, MoSi₂',
    system:'sysTI',
    note:'Body-centred tetragonal. c/a ≠ 1.'
  },
  ort_p: {
    name:'Orthorhombic P', label:'oP', color:0xa5d6a7,
    bravais:true, ax:1.0, ay:1.4, az:1.8,
    atoms:[
      {f:[0,0,0],r_sf:1.0},{f:[1,0,0],r_sf:1.0},{f:[0,1,0],r_sf:1.0},{f:[0,0,1],r_sf:1.0},
      {f:[1,1,0],r_sf:1.0},{f:[1,0,1],r_sf:1.0},{f:[0,1,1],r_sf:1.0},{f:[1,1,1],r_sf:1.0}
    ],
    bondRule:'metal',
    z:1, cn:6, apf:'~52%', param:'a≠b≠c, α=β=γ=90°',
    examples:'Orthorhombic S, Ga',
    system:'sysOP',
    note:'All three axes differ. All angles 90°.'
  },
  ort_i: {
    name:'Orthorhombic I', label:'oI', color:0xa5d6a7,
    bravais:true, ax:1.0, ay:1.4, az:1.8,
    atoms:[
      {f:[0,0,0],r_sf:1.0},{f:[1,0,0],r_sf:1.0},{f:[0,1,0],r_sf:1.0},{f:[0,0,1],r_sf:1.0},
      {f:[1,1,0],r_sf:1.0},{f:[1,0,1],r_sf:1.0},{f:[0,1,1],r_sf:1.0},{f:[1,1,1],r_sf:1.0},
      {f:[0.5,0.5,0.5],r_sf:1.0}
    ],
    bondRule:'metal',
    z:2, cn:8, apf:'~68%', param:'a≠b≠c, α=β=γ=90°',
    examples:'CrB, TiSi₂',
    system:'sysOI',
    note:'Body-centred with all three axes different.'
  },
  ort_f: {
    name:'Orthorhombic F', label:'oF', color:0xa5d6a7,
    bravais:true, ax:1.0, ay:1.4, az:1.8,
    atoms:[
      {f:[0,0,0],r_sf:0.9},{f:[1,0,0],r_sf:0.9},{f:[0,1,0],r_sf:0.9},{f:[0,0,1],r_sf:0.9},
      {f:[1,1,0],r_sf:0.9},{f:[1,0,1],r_sf:0.9},{f:[0,1,1],r_sf:0.9},{f:[1,1,1],r_sf:0.9},
      {f:[0.5,0.5,0],r_sf:0.9},{f:[0.5,0.5,1],r_sf:0.9},
      {f:[0.5,0,0.5],r_sf:0.9},{f:[0.5,1,0.5],r_sf:0.9},
      {f:[0,0.5,0.5],r_sf:0.9},{f:[1,0.5,0.5],r_sf:0.9}
    ],
    bondRule:'metal',
    z:4, cn:12, apf:'~74%', param:'a≠b≠c, α=β=γ=90°',
    examples:'Mg₂Si, olivine',
    system:'sysOF',
    note:'All faces centred. Axes all different.'
  },
  ort_c: {
    name:'Orthorhombic C', label:'oC', color:0xa5d6a7,
    bravais:true, ax:1.0, ay:1.4, az:1.8,
    atoms:[
      {f:[0,0,0],r_sf:1.0},{f:[1,0,0],r_sf:1.0},{f:[0,1,0],r_sf:1.0},{f:[0,0,1],r_sf:1.0},
      {f:[1,1,0],r_sf:1.0},{f:[1,0,1],r_sf:1.0},{f:[0,1,1],r_sf:1.0},{f:[1,1,1],r_sf:1.0},
      {f:[0.5,0.5,0],r_sf:1.0},{f:[0.5,0.5,1],r_sf:1.0}
    ],
    bondRule:'metal',
    z:2, cn:6, apf:'~60%', param:'a≠b≠c, α=β=γ=90°',
    examples:'KNO₃, BaSO₄',
    system:'sysOC',
    note:'ab-face centred (C centering).'
  },
  hex_p: {
    name:'Hexagonal P', label:'hP', color:0xffcc80,
    bravais:true,
    lv:[
      [CS,    0,       0   ],
      [-CS/2, CS*0.866, 0  ],
      [0,     0,       CS*1.6]
    ],
    atoms:[
      {f:[0,0,0],r_sf:1.2},{f:[1,0,0],r_sf:1.2},
      {f:[0,1,0],r_sf:1.2},{f:[1,1,0],r_sf:1.2},
      {f:[0,0,1],r_sf:1.2},{f:[1,0,1],r_sf:1.2},
      {f:[0,1,1],r_sf:1.2},{f:[1,1,1],r_sf:1.2}
    ],
    bondRule:'metal',
    z:1, cn:'6+2 (c/a)', apf:'~60%', param:'a=b≠c, α=β=90°, γ=120°',
    examples:'Mg, Be, Zn (all hP2)',
    system:'sysHP',
    note:'Hexagonal symmetry. γ=120°.'
  },
  rho_r: {
    name:'Trigonal R (Rhombohedral)', label:'hR', color:0xce93d8,
    bravais:true,
    lv:[
      [CS,      0,       0     ],
      [CS*0.5,  CS*0.866, 0    ],
      [CS*0.5,  CS*0.289, CS*0.816]
    ],
    atoms:[
      {f:[0,0,0],r_sf:1.3},{f:[1,0,0],r_sf:1.3},
      {f:[0,1,0],r_sf:1.3},{f:[0,0,1],r_sf:1.3},
      {f:[1,1,0],r_sf:1.3},{f:[1,0,1],r_sf:1.3},
      {f:[0,1,1],r_sf:1.3},{f:[1,1,1],r_sf:1.3}
    ],
    bondRule:'metal',
    z:3, cn:6, apf:'~60%', param:'a=b=c, α=β=γ≠90°',
    examples:'Calcite (CaCO₃), Bi, As, Al₂O₃',
    system:'sysHR',
    note:'All axes equal, all angles equal but ≠90°.'
  },
  mon_p: {
    name:'Monoclinic P', label:'mP', color:0xef9a9a,
    bravais:true,
    lv:[
      [CS,        0,       0         ],
      [0,         CS*1.3,  0         ],
      [CS*1.6*(-0.342), 0, CS*1.6*0.940]
    ],
    atoms:[
      {f:[0,0,0],r_sf:1.1},{f:[1,0,0],r_sf:1.1},{f:[0,1,0],r_sf:1.1},{f:[0,0,1],r_sf:1.1},
      {f:[1,1,0],r_sf:1.1},{f:[1,0,1],r_sf:1.1},{f:[0,1,1],r_sf:1.1},{f:[1,1,1],r_sf:1.1}
    ],
    bondRule:'metal',
    z:1, cn:6, apf:'~50%', param:'a≠b≠c, α=γ=90°, β=110°',
    examples:'Gypsum, β-S, sucrose',
    system:'sysMP',
    note:'One monoclinic angle β≠90°.'
  },
  mon_c: {
    name:'Monoclinic C', label:'mC', color:0xef9a9a,
    bravais:true,
    lv:[
      [CS,        0,       0         ],
      [0,         CS*1.3,  0         ],
      [CS*1.6*(-0.342), 0, CS*1.6*0.940]
    ],
    atoms:[
      {f:[0,0,0],r_sf:1.1},{f:[1,0,0],r_sf:1.1},{f:[0,1,0],r_sf:1.1},{f:[0,0,1],r_sf:1.1},
      {f:[1,1,0],r_sf:1.1},{f:[1,0,1],r_sf:1.1},{f:[0,1,1],r_sf:1.1},{f:[1,1,1],r_sf:1.1},
      {f:[0.5,0.5,0],r_sf:1.1},{f:[0.5,0.5,1],r_sf:1.1}
    ],
    bondRule:'metal',
    z:2, cn:6, apf:'~55%', param:'a≠b≠c, α=γ=90°, β=110°',
    examples:'Mica, orthoclase feldspar',
    system:'sysMC',
    note:'ab-face centred monoclinic. β≠90°.'
  },
  tri_p: (() => {
    const a=CS, b=CS*1.2, c=CS*1.5
    const A=95*Math.PI/180, B=110*Math.PI/180, G=80*Math.PI/180
    const cosA=Math.cos(A), cosB=Math.cos(B), cosG=Math.cos(G), sinG=Math.sin(G)
    const a3x=c*cosB
    const a3y=c*(cosA-cosB*cosG)/sinG
    const a3z=c*Math.sqrt(Math.max(0,1-cosB*cosB-((cosA-cosB*cosG)/sinG)**2))
    return {
      name:'Triclinic P', label:'aP', color:0xff8a65,
      bravais:true,
      lv:[[a,0,0],[b*cosG,b*sinG,0],[a3x,a3y,a3z]],
      atoms:[
        {f:[0,0,0],r_sf:1.2},{f:[1,0,0],r_sf:1.2},{f:[0,1,0],r_sf:1.2},{f:[0,0,1],r_sf:1.2},
        {f:[1,1,0],r_sf:1.2},{f:[1,0,1],r_sf:1.2},{f:[0,1,1],r_sf:1.2},{f:[1,1,1],r_sf:1.2}
      ],
      bondRule:'metal',
      z:1, cn:6, apf:'~52%', param:'a≠b≠c, α=95°, β=110°, γ=80°',
      examples:'Plagioclase feldspar, kaolinite',
      system:'sysAP',
      note:'Lowest symmetry. All axes and angles different.'
    }
  })()
}

export const STRUCT_KEYS = Object.keys(STRUCTS)

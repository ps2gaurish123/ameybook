import React, { useState, useMemo, useEffect } from 'react';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';

interface ChecklistsProps {
  checklistProgress: { [checklistId: string]: string[] }; // checklistId -> array of item ids checked
  onToggleItem: (checklistId: string, itemId: string) => void;
}

interface SubItem {
  id: string;
  text: string;
  isCustom?: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  hint?: string;
  isCustom?: boolean;
  subItems: SubItem[];
}

interface ChecklistGroup {
  id: string;
  name: string;
  items: ChecklistItem[];
}

const DEFAULT_CHECKLIST_GROUPS: ChecklistGroup[] = [
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    items: [
      {
        id: 'p1',
        text: 'Take folic acid & prenatal vitamins daily',
        hint: 'Crucial for early brain and spinal development.',
        subItems: [
          { id: 'p1_s1', text: 'Buy obstetrician-prescribed folic acid (400 mcg)' },
          { id: 'p1_s2', text: 'Set a daily morning alarm reminder' },
          { id: 'p1_s3', text: 'Cross-check with other medications for absorption' }
        ]
      },
      {
        id: 'p2',
        text: 'Attend regular antenatal checkups',
        hint: 'Monitor blood pressure, blood glucose, and baby\'s growth.',
        subItems: [
          { id: 'p2_s1', text: 'Book monthly obstetrician visit slots' },
          { id: 'p2_s2', text: 'Measure blood pressure & record in file' },
          { id: 'p2_s3', text: 'Perform urine protein & blood sugar scans' }
        ]
      },
      {
        id: 'p3',
        text: 'Get Tdap / Tetanus Toxoid vaccine injections',
        hint: 'Usually given in two doses or as a booster during pregnancy.',
        subItems: [
          { id: 'p3_s1', text: 'Confirm vaccination date with doctor (around 27-36 weeks)' },
          { id: 'p3_s2', text: 'Verify entry on maternal immunization card' }
        ]
      },
      {
        id: 'p4',
        text: 'Schedule 20-week anomaly ultrasound scan',
        hint: 'Verifies structural development of heart, brain, and limbs.',
        subItems: [
          { id: 'p4_s1', text: 'Book scan slot with qualified radiologist' },
          { id: 'p4_s2', text: 'Review cardiac chambers & brain development report' }
        ]
      },
      {
        id: 'p5',
        text: 'Track daily fetal movements (kick counts)',
        hint: 'In the third trimester, note active movement intervals.',
        subItems: [
          { id: 'p5_s1', text: 'Count twice daily (morning & evening)' },
          { id: 'p5_s2', text: 'Verify at least 10 kicks within 2 hours' }
        ]
      },
      {
        id: 'p6',
        text: 'Register for birth or lactation preparation classes',
        hint: 'Improves confidence in breathing and breastfeeding.',
        subItems: [
          { id: 'p6_s1', text: 'Enroll in prenatal breathing/lamaze class' },
          { id: 'p6_s2', text: 'Attend lactation support positioning session' }
        ]
      }
    ]
  },
  {
    id: 'hospital_bag',
    name: 'Hospital Bag',
    items: [
      {
        id: 'hb1',
        text: 'Mother\'s identity cards & medical files',
        hint: 'Antenatal cards, ultrasound reports, doctor prescriptions.',
        subItems: [
          { id: 'hb1_s1', text: 'Compile ultrasound scans in chronological order' },
          { id: 'hb1_s2', text: 'Keep blood group card and prescription on top' }
        ]
      },
      {
        id: 'hb2',
        text: 'Comfortable, front-opening nursing clothes',
        hint: 'Makes skin-to-skin contact and early latching easy.',
        subItems: [
          { id: 'hb2_s1', text: 'Pack 3-4 soft front-opening cotton nightgowns or shirts' }
        ]
      },
      {
        id: 'hb3',
        text: 'Nursing bras and sanitary pads (heavy flow)',
        hint: 'Maternity-size pads are essential for early postpartum.',
        subItems: [
          { id: 'hb3_s1', text: 'Pack 2 packs of heavy maternity sanitary pads' },
          { id: 'hb3_s2', text: 'Pack 3 comfortable nursing bras' }
        ]
      },
      {
        id: 'hb4',
        text: 'Soft cotton baby onesies & swaddle cloths',
        hint: 'Pre-washed cotton is gentlest on baby\'s new skin.',
        subItems: [
          { id: 'hb4_s1', text: 'Wash 5 cotton onesies with mild baby detergent' },
          { id: 'hb4_s2', text: 'Pack 3 soft muslin swaddling wraps' }
        ]
      },
      {
        id: 'hb5',
        text: 'Baby cap, socks, and mittens',
        hint: 'Prevents heat loss and keeps baby from scratching their face.',
        subItems: [
          { id: 'hb5_s1', text: 'Pack 2 baby caps for indoor warmth' },
          { id: 'hb5_s2', text: 'Pack 2 pairs of cotton socks & scratch mittens' }
        ]
      },
      {
        id: 'hb6',
        text: 'Phone chargers, power bank, toiletries',
        hint: 'Toothbrush, soap, towels for mother and father.',
        subItems: [
          { id: 'hb6_s1', text: 'Pack extra long charging cords' },
          { id: 'hb6_s2', text: 'Pack soap, towels, toothpaste & comb for both parents' }
        ]
      }
    ]
  },
  {
    id: 'newborn',
    name: 'Newborn Care',
    items: [
      {
        id: 'n1',
        text: 'Ensure skin-to-skin contact (Golden Hour)',
        hint: 'Immediate skin contact stabilizes baby\'s heart and breathing.',
        subItems: [
          { id: 'n1_s1', text: 'Request Golden Hour contact from delivery team' },
          { id: 'n1_s2', text: 'Keep baby\'s hands unwashed briefly for scent familiarity' }
        ]
      },
      {
        id: 'n2',
        text: 'Breastfeed within the first hour of birth',
        hint: 'Colostrum (first milk) acts as baby\'s first natural vaccine.',
        subItems: [
          { id: 'n2_s1', text: 'Latch baby within first hour of delivery' },
          { id: 'n2_s2', text: 'Ensure baby swallows the yellow colostrum milk' }
        ]
      },
      {
        id: 'n3',
        text: 'Newborn screening tests (UNHS hearing & CCHD pulse ox)',
        hint: 'Universal tests to rule out hearing loss or heart anomalies early.',
        subItems: [
          { id: 'n3_s1', text: 'Schedule hearing screening (UNHS) before discharge' },
          { id: 'n3_s2', text: 'Verify pulse oximetry test for congenital heart checks (CCHD)' }
        ]
      },
      {
        id: 'n4',
        text: 'Get birth vaccines: BCG, OPV-0, Hepatitis B-0',
        hint: 'Essential vaccinations given before hospital discharge.',
        subItems: [
          { id: 'n4_s1', text: 'Administer BCG (Tuberculosis) vaccine shot' },
          { id: 'n4_s2', text: 'Administer oral Polio drops (OPV-0)' },
          { id: 'n4_s3', text: 'Administer Hepatitis B birth dose injection' }
        ]
      },
      {
        id: 'n5',
        text: 'Cord care: Keep umbilical cord dry and bare',
        hint: 'Do NOT apply turmeric, oils, or powders. Keep clean.',
        subItems: [
          { id: 'n5_s1', text: 'Fold diaper below the stump to keep dry and exposed' },
          { id: 'n5_s2', text: 'Never apply oils, turmeric, or antiseptic powders on stump' }
        ]
      },
      {
        id: 'n6',
        text: 'Register birth and obtain birth certificate',
        hint: 'Usually processed directly by the birth hospital.',
        subItems: [
          { id: 'n6_s1', text: 'Submit birth detail forms to hospital register counter' }
        ]
      }
    ]
  },
  {
    id: 'feeding',
    name: 'Feeding',
    items: [
      {
        id: 'f1',
        text: 'Feed on demand (8-12 times per 24 hours)',
        hint: 'Feed whenever baby shows cues, don\'t wait for crying.',
        subItems: [
          { id: 'f1_s1', text: 'Watch for rooting, hand-sucking, and smacking cues' },
          { id: 'f1_s2', text: 'Feed at least 8 to 12 times per 24 hours' },
          { id: 'f1_s3', text: 'Wake sleepy newborn if asleep longer than 3 hours' }
        ]
      },
      {
        id: 'f2',
        text: 'Achieve a deep latch position',
        hint: 'Wide mouth, flanged lips, chin touching breast, no nipple pain.',
        subItems: [
          { id: 'f2_s1', text: 'Wait for wide open mouth (like a yawn)' },
          { id: 'f2_s2', text: 'Confirm lower lip rolled outward (flanged)' },
          { id: 'f2_s3', text: 'Ensure chin rests firmly against maternal breast' }
        ]
      },
      {
        id: 'f3',
        text: 'Burp the baby after every single feed',
        hint: 'Hold baby upright against chest or sit them on your lap.',
        subItems: [
          { id: 'f3_s1', text: 'Burp gently for 10-15 minutes after feeding session' }
        ]
      },
      {
        id: 'f4',
        text: 'Check diaper output (at least 6 wet, 3 stools)',
        hint: 'Reliable indicators of adequate breastmilk intake from day 5.',
        subItems: [
          { id: 'f4_s1', text: 'Log 6+ heavy wet diaper changes daily' },
          { id: 'f4_s2', text: 'Verify 3+ mustard-yellow seedy stools daily' }
        ]
      },
      {
        id: 'f5',
        text: 'Mother consumes 3-4 liters of water daily',
        hint: 'Hydration is critical to support healthy milk supply.',
        subItems: [
          { id: 'f5_s1', text: 'Keep a 1-liter bottle at the feeding chair' }
        ]
      }
    ]
  },
  {
    id: 'sleep',
    name: 'Safe Sleep',
    items: [
      {
        id: 's1',
        text: 'Always place baby flat on their back for sleep',
        hint: 'Prevents airway obstruction and significantly reduces SIDS risk.',
        subItems: [
          { id: 's1_s1', text: 'Lay baby flat on back for night and naps' },
          { id: 's1_s2', text: 'Do not sleep baby in car seats, swings or carriers' }
        ]
      },
      {
        id: 's2',
        text: 'Keep the cot completely bare',
        hint: 'No pillows, blankets, quilts, bolsters, bumpers, or toys.',
        subItems: [
          { id: 's2_s1', text: 'Remove pillows, cushions & heavy quilts from cot' },
          { id: 's2_s2', text: 'Do not place bumper pads or stuffed toys in bed' }
        ]
      },
      {
        id: 's3',
        text: 'Room-share, but do not bed-share',
        hint: 'Keep baby\'s cot within arm\'s reach, but sleep on separate surfaces.',
        subItems: [
          { id: 's3_s1', text: 'Keep crib in parents\' bedroom for first 6 months' },
          { id: 's3_s2', text: 'Avoid sharing the same bed surface for sleep' }
        ]
      },
      {
        id: 's4',
        text: 'Maintain a comfortable room temp (24°C–26°C)',
        hint: 'Babies sleep best in mild temperatures; avoid heavy bundle wrapping.',
        subItems: [
          { id: 's4_s1', text: 'Set air conditioner or heater between 24°C–26°C' },
          { id: 's4_s2', text: 'Dress baby in light layers; check back of neck for sweat' }
        ]
      },
      {
        id: 's5',
        text: 'No weighted swaddles, blankets, or hats during sleep',
        hint: 'Hats can cause overheating; weights compress the chest.',
        subItems: [
          { id: 's5_s1', text: 'Remove headwear during sleep to prevent overheating' },
          { id: 's5_s2', text: 'Avoid using weighted swaddles or chest blankets' }
        ]
      }
    ]
  },
  {
    id: 'vaccines',
    name: 'Vaccinations',
    items: [
      {
        id: 'v1',
        text: 'Birth Vaccines',
        hint: 'Essential starting vaccines.',
        subItems: [
          { id: 'v1_s1', text: 'BCG (Tuberculosis)' },
          { id: 'v1_s2', text: 'OPV (Polio)' },
          { id: 'v1_s3', text: 'Hepatitis B-1 birth dose' }
        ]
      },
      {
        id: 'v2',
        text: '6 Weeks Vaccines',
        hint: 'Often bundled as a 6-in-1 combo shot plus oral drops.',
        subItems: [
          { id: 'v2_s1', text: 'DTaP/DTwP-1 (Diphtheria, Tetanus, Pertussis)' },
          { id: 'v2_s2', text: 'IPV-1 (Inactivated Polio Injection)' },
          { id: 'v2_s3', text: 'Hep B-2 and Hib-1' },
          { id: 'v2_s4', text: 'Rota-1 (oral drops)' },
          { id: 'v2_s5', text: 'PCV-1 (Pneumococcal Conjugate)' }
        ]
      },
      {
        id: 'v3',
        text: '10 Weeks Vaccines',
        hint: 'Second round of primary series.',
        subItems: [
          { id: 'v3_s1', text: 'DTaP/DTwP-2' },
          { id: 'v3_s2', text: 'IPV-2' },
          { id: 'v3_s3', text: 'Hib-2 and Hep B-3' },
          { id: 'v3_s4', text: 'Rota-2' },
          { id: 'v3_s5', text: 'PCV-2' }
        ]
      },
      {
        id: 'v4',
        text: '14 Weeks Vaccines',
        hint: 'Third round of primary series.',
        subItems: [
          { id: 'v4_s1', text: 'DTaP/DTwP-3' },
          { id: 'v4_s2', text: 'IPV-3' },
          { id: 'v4_s3', text: 'Hib-3 and Hep B-4' },
          { id: 'v4_s4', text: 'Rota-3' },
          { id: 'v4_s5', text: 'PCV-3' }
        ]
      },
      {
        id: 'v5',
        text: '6 Months Vaccines',
        hint: 'Influenza starts from 6 months; typhoid depends on clinic advice.',
        subItems: [
          { id: 'v5_s1', text: 'Influenza vaccine-1' },
          { id: 'v5_s2', text: 'Typhoid conjugate vaccine if advised' }
        ]
      },
      {
        id: 'v6',
        text: '7 Months Vaccines',
        hint: 'Second flu dose is usually 4 weeks after the first dose.',
        subItems: [
          { id: 'v6_s1', text: 'Influenza vaccine-2' }
        ]
      },
      {
        id: 'v7',
        text: '9 Months Vaccines',
        hint: 'First measles-mumps-rubella protection visit.',
        subItems: [
          { id: 'v7_s1', text: 'MMR-1' }
        ]
      },
      {
        id: 'v8',
        text: '12 Months Vaccines',
        hint: 'Some vaccines are regional or risk-based.',
        subItems: [
          { id: 'v8_s1', text: 'Hepatitis A' },
          { id: 'v8_s2', text: 'MCV-2' },
          { id: 'v8_s3', text: 'JE-1 where indicated' },
          { id: 'v8_s4', text: 'Cholera vaccine-1 where indicated' }
        ]
      },
      {
        id: 'v9',
        text: '13 Months Vaccines',
        hint: 'Use only when advised for risk or regional indication.',
        subItems: [
          { id: 'v9_s1', text: 'JE-2 where indicated' },
          { id: 'v9_s2', text: 'Cholera vaccine-2 where indicated' }
        ]
      },
      {
        id: 'v10',
        text: '15 Months Vaccines',
        hint: 'Booster and second-year protection visit.',
        subItems: [
          { id: 'v10_s1', text: 'MMR-2' },
          { id: 'v10_s2', text: 'Varicella-1' },
          { id: 'v10_s3', text: 'PCV booster' }
        ]
      },
      {
        id: 'v11',
        text: '16-18 Months Vaccines',
        hint: 'First booster series.',
        subItems: [
          { id: 'v11_s1', text: 'DTaP/DTwP-B1' },
          { id: 'v11_s2', text: 'Hib-B1' },
          { id: 'v11_s3', text: 'IPV-B1' }
        ]
      }
    ]
  },
  {
    id: 'milestones',
    name: 'Milestones',
    items: [
      {
        id: 'm1',
        text: '2 Months Milestones',
        subItems: [
          { id: 'm1_s1', text: 'Lifts head briefly during tummy time' },
          { id: 'm1_s2', text: 'Smiles socially at parents\' faces' }
        ]
      },
      {
        id: 'm2',
        text: '4 Months Milestones',
        subItems: [
          { id: 'm2_s1', text: 'Holds head steady without wobble' },
          { id: 'm2_s2', text: 'Rolls from tummy to back' }
        ]
      },
      {
        id: 'm3',
        text: '6 Months Milestones',
        subItems: [
          { id: 'm3_s1', text: 'Sits upright with pillow support' },
          { id: 'm3_s2', text: 'Babbles vowel sounds (ah, oh)' }
        ]
      },
      {
        id: 'm4',
        text: '9 Months Milestones',
        subItems: [
          { id: 'm4_s1', text: 'Pulls self up to standing on furniture' },
          { id: 'm4_s2', text: 'Crawls on belly or hands and knees' }
        ]
      },
      {
        id: 'm5',
        text: '12 Months Milestones',
        subItems: [
          { id: 'm5_s1', text: 'Stands briefly without support' },
          { id: 'm5_s2', text: 'Uses pincer grasp (thumb and index) to pick small items' }
        ]
      }
    ]
  },
  {
    id: 'doctor',
    name: 'Doctor Visits',
    items: [
      {
        id: 'd1',
        text: 'Check weight, length, and head circumference',
        hint: 'Verify growth fits normal percentiles on pediatrician\'s chart.',
        subItems: [
          { id: 'd1_s1', text: 'Log weight on pediatrician growth chart' },
          { id: 'd1_s2', text: 'Verify height and head circumferences' }
        ]
      },
      {
        id: 'd2',
        text: 'Check hydration and general state',
        hint: 'Verify skin pinch elasticity and soft spot.',
        subItems: [
          { id: 'd2_s1', text: 'Verify soft spot (fontanelle) is flat, not sunken' },
          { id: 'd2_s2', text: 'Verify skin pinch elasticity' }
        ]
      },
      {
        id: 'd3',
        text: 'Review expected vaccine side-effects',
        hint: 'Check paracetamol dosage guidelines.',
        subItems: [
          { id: 'd3_s1', text: 'Ask about paracetamol dosage based on baby\'s current weight' },
          { id: 'd3_s2', text: 'Discuss cold pack routine for vaccination injection leg' }
        ]
      }
    ]
  }
];

export const Checklists: React.FC<ChecklistsProps> = ({ checklistProgress, onToggleItem }) => {
  const [activeGroupId, setActiveGroupId] = useState('pregnancy');
  
  // Custom checklist items loaded from LocalStorage
  const [groups, setGroups] = useState<ChecklistGroup[]>(() => {
    const saved = localStorage.getItem('parenting_app_custom_checklists');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST_GROUPS;
  });

  // Save to LocalStorage whenever groups state changes
  useEffect(() => {
    localStorage.setItem('parenting_app_custom_checklists', JSON.stringify(groups));
  }, [groups]);

  // Form Inputs State
  const [newItemText, setNewItemText] = useState('');
  const [newItemHint, setNewItemHint] = useState('');
  const [newSubItemTexts, setNewSubItemTexts] = useState<{ [itemId: string]: string }>({});

  const activeGroup = useMemo(() => {
    return groups.find(g => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

  const checkedItems = checklistProgress[activeGroup.id] || [];

  // Recalculate tally dynamically including parent-added items
  const pctComplete = useMemo(() => {
    if (activeGroup.items.length === 0) return 0;
    // Calculate total checked subitems and items
    return Math.round((checkedItems.length / activeGroup.items.length) * 100);
  }, [activeGroup, checkedItems]);

  // Helper to append a custom main checklist item
  const handleAddMainItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom_item_${Date.now()}`,
      text: newItemText.trim(),
      hint: newItemHint.trim() || undefined,
      isCustom: true,
      subItems: []
    };

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          items: [...g.items, newItem]
        };
      }
      return g;
    }));

    setNewItemText('');
    setNewItemHint('');
  };

  // Helper to append a custom sub-checklist item
  const handleAddSubItem = (itemId: string) => {
    const text = newSubItemTexts[itemId] || '';
    if (!text.trim()) return;

    const newSub: SubItem = {
      id: `custom_sub_${Date.now()}`,
      text: text.trim(),
      isCustom: true
    };

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          items: g.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                subItems: [...item.subItems, newSub]
              };
            }
            return item;
          })
        };
      }
      return g;
    }));

    setNewSubItemTexts(prev => ({
      ...prev,
      [itemId]: ''
    }));
  };

  // Helper to delete a custom item/subitem
  const handleDeleteItem = (itemId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          items: g.items.filter(item => item.id !== itemId)
        };
      }
      return g;
    }));
    // Clean up checked states if it was checked
    if (checkedItems.includes(itemId)) {
      onToggleItem(activeGroupId, itemId);
    }
  };

  const handleDeleteSubItem = (itemId: string, subId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          items: g.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                subItems: item.subItems.filter(sub => sub.id !== subId)
              };
            }
            return item;
          })
        };
      }
      return g;
    }));
    // Clean up checked states if it was checked
    if (checkedItems.includes(subId)) {
      onToggleItem(activeGroupId, subId);
    }
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      
      {/* Horizontal Tab bar */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
          Select Checklist
        </div>
        <div className="timeline-scroller">
          {groups.map(g => (
            <button
              key={g.id}
              className={`timeline-tab ${activeGroupId === g.id ? 'active' : ''}`}
              onClick={() => setActiveGroupId(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title" style={{ margin: 0, fontSize: '15px' }}>
            <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
            <span>{activeGroup.name} Checklist</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
            {checkedItems.filter(id => activeGroup.items.some(item => item.id === id || item.subItems.some(sub => sub.id === id))).length} Checked
          </span>
        </div>
        <div className="progress-bar-container" style={{ height: '8px' }}>
          <div className="progress-bar-fill" style={{ width: `${pctComplete}%` }} />
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeGroup.items.map(item => {
          const isItemChecked = checkedItems.includes(item.id);
          
          return (
            <div 
              key={item.id} 
              className={`card ${isItemChecked ? 'checked' : ''}`}
              style={{ 
                padding: '14px 16px',
                borderLeft: item.isCustom ? '4px solid #8e24aa' : '4px solid var(--primary-light)',
                backgroundColor: item.isCustom ? 'rgba(142, 36, 170, 0.03)' : 'var(--card-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Main Checklist Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={isItemChecked}
                  onChange={() => onToggleItem(activeGroup.id, item.id)}
                  style={{ 
                    marginTop: '4px',
                    accentColor: item.isCustom ? '#8e24aa' : 'var(--primary)'
                  }}
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span 
                    style={{ 
                      fontWeight: '600', 
                      fontSize: '14px', 
                      color: item.isCustom ? '#7b1fa2' : 'var(--text-heading)',
                      textDecoration: isItemChecked ? 'line-through' : 'none',
                      opacity: isItemChecked ? 0.6 : 1
                    }}
                  >
                    {item.text} {item.isCustom && <span style={{ fontSize: '10px', color: '#8e24aa', fontStyle: 'italic', fontWeight: 'bold' }}>(Parent Add)</span>}
                  </span>
                  {item.hint && !isItemChecked && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.hint}
                    </span>
                  )}
                </div>

                {item.isCustom && (
                  <button 
                    style={{ border: 'none', background: 'none', color: '#d32f2f', cursor: 'pointer', padding: '4px' }}
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Sub-Checklist Section */}
              <div 
                style={{ 
                  marginLeft: '24px', 
                  paddingLeft: '12px', 
                  borderLeft: '1.5px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {item.subItems.map(sub => {
                  const isSubChecked = checkedItems.includes(sub.id);
                  return (
                    <div 
                      key={sub.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        backgroundColor: sub.isCustom ? 'rgba(142, 36, 170, 0.04)' : 'transparent',
                        padding: '4px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSubChecked}
                        onChange={() => onToggleItem(activeGroup.id, sub.id)}
                        style={{ 
                          accentColor: sub.isCustom ? '#8e24aa' : 'var(--primary)'
                        }}
                      />
                      <span 
                        style={{ 
                          fontSize: '12.5px', 
                          color: sub.isCustom ? '#7b1fa2' : 'var(--text)',
                          textDecoration: isSubChecked ? 'line-through' : 'none',
                          opacity: isSubChecked ? 0.6 : 1,
                          flex: 1
                        }}
                      >
                        {sub.text} {sub.isCustom && <span style={{ fontSize: '9px', color: '#8e24aa', fontStyle: 'italic' }}>(Add)</span>}
                      </span>

                      {sub.isCustom && (
                        <button 
                          style={{ border: 'none', background: 'none', color: '#c62828', cursor: 'pointer', padding: '2px' }}
                          onClick={() => handleDeleteSubItem(item.id, sub.id)}
                          title="Delete subaction"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Sub-item Form */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                  <input 
                    type="text" 
                    placeholder="➕ Add sub-action..."
                    value={newSubItemTexts[item.id] || ''}
                    onChange={(e) => setNewSubItemTexts(prev => ({ ...prev, [item.id]: e.target.value }))}
                    style={{ 
                      flex: 1, 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card-bg)',
                      outline: 'none',
                      color: 'var(--text)'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubItem(item.id);
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAddSubItem(item.id)}
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#8e24aa',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#fff'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Custom Main Item Card */}
      <form onSubmit={handleAddMainItem} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1.5px dashed #8e24aa', backgroundColor: 'rgba(142, 36, 170, 0.01)' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#7b1fa2', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={16} /> Add Custom Checklist Item
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            className="input-text" 
            placeholder="Item description (e.g. Call pediatrician clinic)..." 
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            style={{ borderRadius: '6px', fontSize: '12.5px', padding: '8px 12px', borderColor: 'rgba(142, 36, 170, 0.3)' }}
          />
          <input 
            type="text" 
            className="input-text" 
            placeholder="Optional tip/hint detail..." 
            value={newItemHint}
            onChange={e => setNewItemHint(e.target.value)}
            style={{ borderRadius: '6px', fontSize: '11.5px', padding: '8px 12px', borderColor: 'rgba(142, 36, 170, 0.2)' }}
          />
        </div>
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ padding: '10px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#8e24aa' }}
        >
          Add to {activeGroup.name} Checklist
        </button>
      </form>
      
    </div>
  );
};

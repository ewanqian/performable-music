// Six separate research families x nine evidence-driven visual presets.
// Presets are 54 comparable parameterized experiments, NOT 54 original simulation algorithms.
// No high-contrast flashing >3 Hz; audio rhythm and temporal luminance are not the same thing.
export const FAMILIES=Object.freeze([
  {
    "id": "light",
    "label": "01 / 光的时间组织",
    "en": "TEMPORAL LIGHT",
    "model": "9 distinct continuous temporal envelopes on spatially distributed luminaires",
    "items": [
      [
        "稳态场",
        "Steady State",
        "建立无节奏基线，对比其他时间策略",
        "constant",
        {
          "rate": 0,
          "group": 1,
          "width": 0.8
        }
      ],
      [
        "慢呼吸",
        "Slow Breath",
        "单周期缓慢增减检验明暗是否保留体积",
        "sine",
        {
          "rate": 0.23,
          "group": 1,
          "width": 1
        }
      ],
      [
        "圆周行波",
        "Orbit Chase",
        "相位沿三维灯位传播，观察方向可辨性",
        "phase",
        {
          "rate": 0.33,
          "group": 9,
          "width": 0.58
        }
      ],
      [
        "分组交替",
        "Interleaved",
        "奇偶灯组以平滑交叉淡变，测试声部分离",
        "alternate",
        {
          "rate": 0.42,
          "group": 2,
          "width": 0.65
        }
      ],
      [
        "渐强积累",
        "Crescendo Hold",
        "从低亮度渐强再保留，测量悬念和层次",
        "ramp",
        {
          "rate": 0.19,
          "group": 1,
          "width": 0.55
        }
      ],
      [
        "脉冲包络",
        "Soft Impulse",
        "100BPM 节拍事件驱动柔和衰减，不使用快速闪屏",
        "impulse",
        {
          "rate": 1.666,
          "group": 1,
          "width": 0.32
        }
      ],
      [
        "内外错相",
        "Depth Offset",
        "远近两层相位不同，使亮度产生空间深度",
        "depth",
        {
          "rate": 0.34,
          "group": 3,
          "width": 0.48
        }
      ],
      [
        "尾迹交接",
        "Relay Trail",
        "能量在相邻灯位之间接力，强调运动连续性",
        "relay",
        {
          "rate": 0.48,
          "group": 5,
          "width": 0.34
        }
      ],
      [
        "静默释放",
        "Release to Dark",
        "演奏末端的缓慢释放，不制造突然全场黑闪",
        "release",
        {
          "rate": 0.14,
          "group": 1,
          "width": 1
        }
      ]
    ]
  },
  {
    "id": "brightness",
    "label": "02 / 亮度的空间分布",
    "en": "SPATIAL LUMINANCE",
    "model": "9 spatial attenuation / material response formulations on one fixed 3D reference sculpture",
    "items": [
      [
        "距离衰减",
        "Distance Falloff",
        "区分物体前后表面的衰减轮廓",
        "distance",
        {
          "field": 0,
          "contrast": 0.55
        }
      ],
      [
        "深度分层",
        "Depth Slice",
        "仅改变物理 Z 深度分布，检验深度可读性",
        "depth",
        {
          "field": 1,
          "contrast": 0.6
        }
      ],
      [
        "焦点光锥",
        "Spot Focus",
        "狭角与宽角照射的形态辨识度对比",
        "spot",
        {
          "field": 2,
          "contrast": 0.7
        }
      ],
      [
        "轮廓边光",
        "Edge Rim",
        "强调轮廓和细薄枝条而不靠整体曝光",
        "rim",
        {
          "field": 3,
          "contrast": 0.8
        }
      ],
      [
        "分布式光源",
        "Distributed Nodes",
        "多个光源贡献线框曲面各部分亮度",
        "cluster",
        {
          "field": 4,
          "contrast": 0.55
        }
      ],
      [
        "材质发射",
        "Local Emission",
        "亮度由对象局部语义控制而非远距离灯光",
        "emission",
        {
          "field": 5,
          "contrast": 0.65
        }
      ],
      [
        "遮蔽阴影",
        "Occlusion Study",
        "遮挡后的亮度与可见轮廓变化",
        "occlusion",
        {
          "field": 6,
          "contrast": 0.75
        }
      ],
      [
        "雾中的光",
        "Fog Depth",
        "雾浓度影响深度对比；不是体积光物理求解",
        "fog",
        {
          "field": 7,
          "contrast": 0.5
        }
      ],
      [
        "曝光压缩",
        "Exposure Discipline",
        "用压缩亮度观察极端亮区是否丢失结构",
        "tone",
        {
          "field": 8,
          "contrast": 0.35
        }
      ]
    ]
  },
  {
    "id": "objects",
    "label": "03 / 三维物体与拓扑",
    "en": "VOLUME / TOPOLOGY",
    "model": "9 different geometric rules; must be genuinely rotatable in world coordinates",
    "items": [
      [
        "同心球壳",
        "Nested Shells",
        "曲率和壳层之间的空间间距是否可感知",
        "shells",
        {
          "topology": 0,
          "complexity": 0.48
        }
      ],
      [
        "环形轨道",
        "Orbital Rings",
        "多轴交错环是否产生可演奏通路",
        "rings",
        {
          "topology": 1,
          "complexity": 0.53
        }
      ],
      [
        "肋骨构架",
        "Rib Structure",
        "连续骨架节距形成深度与遮挡",
        "ribs",
        {
          "topology": 2,
          "complexity": 0.62
        }
      ],
      [
        "多面晶格",
        "Crystalline Lattice",
        "稀疏实体晶格与节点连线能否兼容手势穿行",
        "lattice",
        {
          "topology": 3,
          "complexity": 0.65
        }
      ],
      [
        "扭曲管廊",
        "Twisted Tubes",
        "路径扭转与管径变化提供舞台立体运动",
        "tubes",
        {
          "topology": 4,
          "complexity": 0.6
        }
      ],
      [
        "剖切体积",
        "Sectioned Volume",
        "截面随手移动揭示内部而非删除对象",
        "section",
        {
          "topology": 5,
          "complexity": 0.45
        }
      ],
      [
        "分层片体",
        "Layered Sheets",
        "薄片在前后不同深度构成层积空间",
        "sheets",
        {
          "topology": 6,
          "complexity": 0.55
        }
      ],
      [
        "磁性集合",
        "Magnetic Assembly",
        "多个实体围绕吸引中心动态重排",
        "cluster",
        {
          "topology": 7,
          "complexity": 0.5
        }
      ],
      [
        "内外翻转",
        "Inside-out Form",
        "曲面法向与形变改变对象内外关系",
        "inversion",
        {
          "topology": 8,
          "complexity": 0.7
        }
      ]
    ]
  },
  {
    "id": "neuron",
    "label": "04 / 神经元与网络形态",
    "en": "NEURON MORPHOLOGY",
    "model": "artist-generated branching geometry; not medical anatomy or a recorded electrical spike",
    "items": [
      [
        "胞体出芽",
        "Soma Emergence",
        "树突从胞体延伸时能否辨识起始点",
        "soma",
        {
          "branch": 0.2,
          "spread": 0.5,
          "pulse": 0.3
        }
      ],
      [
        "树突分支",
        "Dendritic Arbor",
        "分枝角度与长度的层级差异",
        "arbor",
        {
          "branch": 0.72,
          "spread": 0.72,
          "pulse": 0.2
        }
      ],
      [
        "轴突长投射",
        "Axonal Projection",
        "细长投射与局部分枝是否能被区分",
        "axon",
        {
          "branch": 0.3,
          "spread": 0.85,
          "pulse": 0.35
        }
      ],
      [
        "树枝等级",
        "Branch Order",
        "根据分支阶数改变亮度、粗细与可见性",
        "order",
        {
          "branch": 0.6,
          "spread": 0.55,
          "pulse": 0.42
        }
      ],
      [
        "信号沿枝传播",
        "Propagation",
        "合成波前沿父子连线前进，不声称实测动作电位",
        "travel",
        {
          "branch": 0.75,
          "spread": 0.65,
          "pulse": 0.8
        }
      ],
      [
        "突触密集区",
        "Terminal Density",
        "末梢节点聚集如何产生有意义的亮度密度",
        "terminals",
        {
          "branch": 0.8,
          "spread": 0.6,
          "pulse": 0.5
        }
      ],
      [
        "两细胞接触",
        "Network Contact",
        "两套独立神经结构接近形成空间关系",
        "contact",
        {
          "branch": 0.65,
          "spread": 0.58,
          "pulse": 0.65
        }
      ],
      [
        "删枝与重构",
        "Prune / Regrow",
        "动态去除弱连接后产生的新轮廓",
        "prune",
        {
          "branch": 0.7,
          "spread": 0.56,
          "pulse": 0.35
        }
      ],
      [
        "形态测量",
        "Morphometry",
        "节点、长度、分支数随结构参数可量化",
        "measure",
        {
          "branch": 0.83,
          "spread": 0.7,
          "pulse": 0.2
        }
      ]
    ]
  },
  {
    "id": "physarum",
    "label": "05 / 粘菌式自组织",
    "en": "PHYSARUM-INSPIRED",
    "model": "3D procedural growth / pursuit approximation, not validated Physarum physics; true 3D chemo-field simulation is future work",
    "items": [
      [
        "单源寻食",
        "Single Attractor",
        "从单个生长中心向目标趋近",
        "single",
        {
          "attract": 0.9,
          "repel": 0.08,
          "branch": 0.22
        }
      ],
      [
        "双源竞争",
        "Dual Nutrient",
        "两处目标竞争路线，比较分枝",
        "dual",
        {
          "attract": 0.8,
          "repel": 0.14,
          "branch": 0.4
        }
      ],
      [
        "排斥障碍",
        "Obstacle Avoidance",
        "障碍物改变生长通路并产生绕行",
        "obstacle",
        {
          "attract": 0.7,
          "repel": 0.87,
          "branch": 0.33
        }
      ],
      [
        "网络融合",
        "Network Fusion",
        "来自多处的枝条向共同节点汇聚",
        "fusion",
        {
          "attract": 0.95,
          "repel": 0.16,
          "branch": 0.48
        }
      ],
      [
        "通道加粗",
        "Tube Reinforcement",
        "重复经过的路由增加管径以呈现通量",
        "reinforce",
        {
          "attract": 0.9,
          "repel": 0.09,
          "branch": 0.64
        }
      ],
      [
        "扩散探索",
        "Exploration",
        "降低目标吸引使分枝在空间搜索",
        "explore",
        {
          "attract": 0.35,
          "repel": 0.18,
          "branch": 0.95
        }
      ],
      [
        "衰退收缩",
        "Retraction",
        "弱连接逐渐退场，保留主干",
        "retract",
        {
          "attract": 0.72,
          "repel": 0.11,
          "branch": 0.58
        }
      ],
      [
        "空间营养层",
        "Nutrient Gradient",
        "营养点位置驱动不同高度的通道增长",
        "gradient",
        {
          "attract": 0.77,
          "repel": 0.1,
          "branch": 0.76
        }
      ],
      [
        "三维群落",
        "Colony Interaction",
        "多个核心构成多尺度自组织场景",
        "colonies",
        {
          "attract": 0.67,
          "repel": 0.27,
          "branch": 0.82
        }
      ]
    ]
  },
  {
    "id": "sakura",
    "label": "06 / 樱花与植物时间",
    "en": "SAKURA / BOTANICAL",
    "model": "procedural 3D branch generator + instanced petals with gravity and wind; no downloaded art assets",
    "items": [
      [
        "单枝萌芽",
        "Bud Emergence",
        "枝条从单轴向多阶生长，保留时间可读性",
        "buds",
        {
          "branch": 0.27,
          "flower": 0.12,
          "wind": 0.06
        }
      ],
      [
        "递归树冠",
        "Fractal Crown",
        "多阶分枝形成真实体积而非球形点云",
        "crown",
        {
          "branch": 0.92,
          "flower": 0.48,
          "wind": 0.12
        }
      ],
      [
        "花朵聚簇",
        "Bloom Cluster",
        "花朵集中在枝尖与向光区域",
        "blossom",
        {
          "branch": 0.75,
          "flower": 0.93,
          "wind": 0.14
        }
      ],
      [
        "双层花瓣",
        "Petal Layers",
        "前后两层花瓣产生体积与遮挡",
        "layers",
        {
          "branch": 0.8,
          "flower": 0.77,
          "wind": 0.08
        }
      ],
      [
        "轻风扰动",
        "Soft Wind",
        "枝条和花瓣共享连续低频三维风场",
        "wind",
        {
          "branch": 0.7,
          "flower": 0.68,
          "wind": 0.38
        }
      ],
      [
        "落英运动",
        "Falling Petals",
        "花瓣具有独立下落速度、旋转与风偏移",
        "fall",
        {
          "branch": 0.7,
          "flower": 0.65,
          "wind": 0.64
        }
      ],
      [
        "环流花雨",
        "Petal Vortex",
        "局部旋涡而非全屏粒子贴图",
        "vortex",
        {
          "branch": 0.65,
          "flower": 0.73,
          "wind": 0.87
        }
      ],
      [
        "开花与凋落",
        "Lifecycle",
        "从花蕾密度上升到花瓣离枝的连续过程",
        "cycle",
        {
          "branch": 0.8,
          "flower": 0.84,
          "wind": 0.26
        }
      ],
      [
        "枝叶归静",
        "Seasonal Silence",
        "花朵消失后的结构如何单独成立",
        "silence",
        {
          "branch": 0.87,
          "flower": 0.03,
          "wind": 0.05
        }
      ]
    ]
  }
]);
export const TOTAL=FAMILIES.reduce((n,f)=>n+f.items.length,0);
export const findStudy=(family,index)=>FAMILIES.find(f=>f.id===family)?.items[index]||null;
export const BEAT_BPM=100;
export const LIGHT_FLASH_POLICY="Continuous low-contrast envelopes; no full-frame red/white strobes; no high-contrast flashes >3Hz.";
export function description(family,index){
 const f=FAMILIES.find(f=>f.id===family),p=f?.items[index];
 if(!p)return null;
 return {family:f.id,title:p[0],en:p[1],hypothesis:p[2],method:p[3],params:p[4],familyName:f.label};
}

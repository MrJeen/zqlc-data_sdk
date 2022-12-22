export const abi = {
  Event: [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] value)',
  ],
  Transfer: {
    1: ['event Transfer(address from, address to, uint256 tokenId)'],
    2: ['event Transfer(address indexed from, address to, uint256 tokenId)'],
    3: [
      'event Transfer(address indexed from, address indexed to, uint256 tokenId)',
    ],
    4: [
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    ],
  },
  TransferSingle: {
    1: [
      'event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)',
    ],
    2: [
      'event TransferSingle(address indexed operator, address from, address to, uint256 id, uint256 value)',
    ],
    3: [
      'event TransferSingle(address indexed operator, address indexed from, address to, uint256 id, uint256 value)',
    ],
    4: [
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    ],
    5: [
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 indexed id, uint256 value)',
    ],
    6: [
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 indexed id, uint256 indexed value)',
    ],
  },
  TransferBatch: {
    1: [
      'event TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] value)',
    ],
    2: [
      'event TransferBatch(address indexed operator, address from, address to, uint256[] ids, uint256[] value)',
    ],
    3: [
      'event TransferBatch(address indexed operator, address indexed from, address to, uint256[] ids, uint256[] value)',
    ],
    4: [
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] value)',
    ],
    5: [
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] indexed ids, uint256[] value)',
    ],
    6: [
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] indexed ids, uint256[] indexed value)',
    ],
  },
};

export const erc721ContractAbi = [
  'function symbol() external view returns (string _symbol)',
  // 根据tokenId获取元数据json地址
  'function tokenURI(uint256 _tokenId) external view returns (string)',
  // 根据tokenId获取拥有者
  'function ownerOf(uint256 _tokenId) external view returns (address)',
];

export const erc1155ContractAbi = [
  // 根据tokenId获取元数据json地址
  'function uri(uint256 _id) external view returns (string memory)',
  // 获取用户拥有对应nft的数量
  'function balanceOf(address _owner, uint256 _id) external view returns (uint256)',
];

export const contractAbi = [
  'function name() external view returns (string _name)',
  'function symbol() external view returns (string _symbol)',
  'function owner() external view returns (address)',
  'function supportsInterface(bytes4 interfaceId) public view returns (bool)',
];

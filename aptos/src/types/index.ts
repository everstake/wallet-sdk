export type StakeActionParams = {
  token: string;
  address: string;
  amount: string;
};

export type StakeBalance = {
  active: string;
  inactive: string;
  pending_inactive: string;
};

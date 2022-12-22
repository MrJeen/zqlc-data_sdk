import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ethers } from 'ethers';

@ValidatorConstraint({ name: 'IsEtherAddress', async: false })
export class IsEtherAddress implements ValidatorConstraintInterface {
  validate(address: string) {
    return ethers.utils.isAddress(address);
  }

  defaultMessage(args: ValidationArguments) {
    return `The ${args.property}: ${args.value} is invalid.`;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll(cognitoId: string): Promise<UserResponseDto[]> {
    const users = await this.userModel
      .find({ cognitoId: { $ne: cognitoId } })
      .exec();
    return users.map((user) => plainToInstance(UserResponseDto, user.toJSON()));
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    return user;
  }

  async findByCognitoId(cognitoId: string): Promise<User> {
    const user = await this.userModel.findOne({ cognitoId }).exec();
    return user;
  }
}

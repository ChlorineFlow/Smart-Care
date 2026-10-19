
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.6.0"
}

provider "aws" {
  region = "ap-south-1"
}

variable "ssh_allowed_cidr" {
  description = "Authorized SSH IPv4 address in CIDR notation"
  type        = string
}

variable "existing_ami_id" {
  description = "AMI ID of the existing SmartCare EC2 instance"
  type        = string
  default     = "ami-007b1f3fdea0383d9"
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "smartcare" {
  name        = "smartcare-devops-sg"
  description = "Security group for SmartCare DevOps server"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from authorized IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins - authorized IP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["104.28.225.14/32"]
  }

  ingress {
    description = "Port 9000 - existing authorized IP"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["49.14.137.139/32"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "smartcare-devops-sg"
  }
}

resource "aws_instance" "smartcare" {
  ami                         = var.existing_ami_id
  instance_type               = "t3.small"
  key_name                    = "smartcare-devops-key"
  associate_public_ip_address = true

  vpc_security_group_ids = [
    aws_security_group.smartcare.id
  ]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name = "smartcare-devops-server"
  }

  lifecycle {
    prevent_destroy = true
  }
}

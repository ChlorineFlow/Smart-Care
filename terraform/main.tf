
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

data "aws_caller_identity" "current" {}

variable "existing_ami_id" {
  description = "AMI ID of the existing SmartCare EC2 instance"
  type        = string
  default     = "ami-007b1f3fdea0383d9"
}

variable "port_9000_allowed_cidrs" {
  description = "IPv4 CIDR ranges allowed to access port 9000"
  type        = list(string)
  default     = []
}

resource "aws_iam_role" "smartcare_ssm" {
  name = "smartcare-devops-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "smartcare_ssm" {
  role       = aws_iam_role.smartcare_ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "smartcare_ssm" {
  name = "smartcare-devops-ssm-profile"
  role = aws_iam_role.smartcare_ssm.name
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "smartcare-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          "token.actions.githubusercontent.com:sub" = "repo:ChlorineFlow/Smart-Care:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "smartcare-github-actions-ssm-deploy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ec2:DescribeInstances"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["ssm:SendCommand"]
        Resource = [
          "arn:aws:ssm:ap-south-1::document/AWS-RunShellScript",
          "arn:aws:ec2:ap-south-1:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.smartcare.id}"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
        Resource = "*"
      }
    ]
  })
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "smartcare" {
  name        = "smartcare-devops-sg"
  description = "Security group for SmartCare DevOps server"
  vpc_id      = data.aws_vpc.default.id

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
    description = "Port 9000 - explicitly configured CIDRs"
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = var.port_9000_allowed_cidrs
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
  iam_instance_profile        = aws_iam_instance_profile.smartcare_ssm.name
  associate_public_ip_address = true

  vpc_security_group_ids = [
    aws_security_group.smartcare.id
  ]

  depends_on = [
    aws_iam_role_policy_attachment.smartcare_ssm
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

output "github_actions_deploy_role_arn" {
  description = "Set this as the GitHub Actions repository variable AWS_DEPLOY_ROLE_ARN"
  value       = aws_iam_role.github_actions_deploy.arn
}
